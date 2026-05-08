import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from './qr.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { PaymentType, ChargeStatus, TransactionStatus } from '@prisma/client';
import { WebhookDispatcher } from '../webhooks/webhook.dispatcher';

const DEFAULT_EXPIRY_MINUTES = 30;
const FEE_BPS = 50; // 0.50% = 50 basis points

@Injectable()
export class ChargesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qr: QrService,
    private readonly webhooks: WebhookDispatcher,
  ) {}

  async create(merchantId: string, dto: CreateChargeDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new NotFoundException('Merchant not found');

    if (dto.externalId) {
      const existing = await this.prisma.charge.findUnique({
        where: { merchantId_externalId: { merchantId, externalId: dto.externalId } },
      });
      if (existing) return this.serialize(existing);
    }

    const expiresAt = new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60_000);

    const charge = await this.prisma.charge.create({
      data: {
        merchantId,
        amountGs: BigInt(dto.amountGs),
        description: dto.description,
        paymentType: dto.paymentType ?? PaymentType.QR_DYNAMIC,
        externalId: dto.externalId,
        metadata: dto.metadata as never,
        status: ChargeStatus.PENDING,
        expiresAt,
      },
    });

    const { payload, dataUrl } = await this.qr.generateForCharge({
      chargeId: charge.id,
      amountGs: dto.amountGs,
      merchantName: merchant.businessName,
      description: dto.description,
    });

    const updated = await this.prisma.charge.update({
      where: { id: charge.id },
      data: { qrPayload: payload, qrImageUrl: dataUrl },
    });

    return this.serialize(updated);
  }

  async findOne(merchantId: string, id: string) {
    const charge = await this.prisma.charge.findFirst({ where: { id, merchantId } });
    return charge ? this.serialize(charge) : null;
  }

  async list(merchantId: string, opts: { limit?: number; status?: ChargeStatus } = {}) {
    const charges = await this.prisma.charge.findMany({
      where: { merchantId, ...(opts.status ? { status: opts.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(opts.limit ?? 50, 200),
    });
    return charges.map((c) => this.serialize(c));
  }

  /**
   * Marca un cobro como pagado y registra la transacción + ledger.
   * En producción real, esto se invoca desde el webhook del SIP/BCP cuando confirma el pago.
   * Mientras no haya conexión real, lo invoca el endpoint admin /admin/charges/:id/simulate-paid.
   */
  async markPaid(chargeId: string, sipPayload: {
    sipTransactionId: string;
    payerName?: string;
    payerDocument?: string;
    payerBankCode?: string;
  }) {
    const charge = await this.prisma.charge.findUnique({ where: { id: chargeId } });
    if (!charge) throw new NotFoundException('Charge not found');
    if (charge.status === ChargeStatus.PAID) {
      throw new ConflictException('Charge already paid');
    }

    const amount = charge.amountGs;
    const fee = (amount * BigInt(FEE_BPS)) / BigInt(10_000);
    const net = amount - fee;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.charge.update({
        where: { id: chargeId },
        data: { status: ChargeStatus.PAID },
      });

      const transaction = await tx.transaction.create({
        data: {
          chargeId,
          sipTransactionId: sipPayload.sipTransactionId,
          amountGs: amount,
          feeGs: fee,
          netAmountGs: net,
          payerName: sipPayload.payerName,
          payerDocument: sipPayload.payerDocument,
          payerBankCode: sipPayload.payerBankCode,
          status: TransactionStatus.COMPLETED,
          rawSipResponse: sipPayload as never,
        },
      });

      // Ledger doble entrada: el SIP liquida → comercio; CobraPy retiene fee.
      await tx.ledgerEntry.createMany({
        data: [
          { transactionId: transaction.id, account: `sip:settlement`,        debitGs: amount, creditGs: BigInt(0), description: 'Liquidación SIP entrante' },
          { transactionId: transaction.id, account: `merchant:${charge.merchantId}`, debitGs: BigInt(0), creditGs: net, description: 'Acreditación al comercio' },
          { transactionId: transaction.id, account: `cobrapy:fees`,          debitGs: BigInt(0), creditGs: fee, description: 'Comisión CobraPy 0.50%' },
        ],
      });

      return { updated, transaction };
    });

    await this.webhooks.dispatch(charge.merchantId, 'charge.paid', {
      chargeId,
      amountGs: Number(amount),
      feeGs: Number(fee),
      netAmountGs: Number(net),
      sipTransactionId: sipPayload.sipTransactionId,
    });

    return this.serialize(result.updated);
  }

  private serialize<T extends { amountGs: bigint }>(charge: T) {
    return { ...charge, amountGs: Number(charge.amountGs) };
  }
}
