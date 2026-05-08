import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class PaymentLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, dto: CreatePaymentLinkDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const slug = this.generateSlug();

    const data: any = {
      merchantId,
      slug,
      title: dto.title,
      description: dto.description,
      active: true,
    };

    if (dto.amountGs !== undefined && dto.amountGs !== null) {
      if (dto.amountGs <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }
      data.amountGs = BigInt(dto.amountGs);
    }

    if (dto.expiresAt) {
      data.expiresAt = new Date(dto.expiresAt);
    }

    if (dto.maxUses) {
      data.maxUses = dto.maxUses;
    }

    const paymentLink = await this.prisma.paymentLink.create({ data });

    return this.serialize(paymentLink);
  }

  async findOne(merchantId: string, id: string) {
    const link = await this.prisma.paymentLink.findFirst({ where: { id, merchantId } });
    if (!link) throw new NotFoundException('Payment link not found');
    return this.serialize(link);
  }

  async list(merchantId: string) {
    const links = await this.prisma.paymentLink.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
    return links.map((l) => this.serialize(l));
  }

  async findBySlug(slug: string) {
    const link = await this.prisma.paymentLink.findUnique({
      where: { slug },
      include: { merchant: true },
    });
    return link;
  }

  async incrementUses(id: string) {
    return this.prisma.paymentLink.update({
      where: { id },
      data: { usesCount: { increment: 1 } },
    });
  }

  async deactivate(merchantId: string, id: string) {
    const link = await this.prisma.paymentLink.findFirst({ where: { id, merchantId } });
    if (!link) throw new NotFoundException('Payment link not found');

    return this.prisma.paymentLink.update({
      where: { id },
      data: { active: false },
    });
  }

  private generateSlug(): string {
    const words = [
      'pago', 'cobro', 'cuenta', 'servicio', 'producto', 'compra', 'venta',
      'pagar', 'cobrar', 'factura', 'recibo', 'pedido', 'orden', 'tienda',
      'negocio', 'comercio', 'store', 'shop', 'pay', 'charge', 'invoice',
    ];
    const nouns = [
      'mercader', 'estancia', 'supermercado', 'restaurant', 'cafe', 'bar',
      'tienda', 'ropa', 'zapato', 'comida', 'bebida', 'transporte', 'servicio',
      'trabajo', 'producto', 'articulo', 'paquete', 'envio', 'delivery',
      'cliente', 'cliente2', 'cliente3', 'cliente4', 'cliente5',
    ];

    const word = words[Math.floor(Math.random() * words.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 9999);

    return `${word}/${noun}-${num}`;
  }

  private serialize(link: any) {
    return {
      ...link,
      amountGs: link.amountGs != null ? Number(link.amountGs) : null,
      expiresAt: link.expiresAt?.toISOString() ?? null,
    };
  }
}