import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChargesService } from '../charges/charges.service';
import { WhatsAppSender } from './whatsapp.sender';
import { parseMessage } from './whatsapp.parser';
import { WaDirection } from '@prisma/client';

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3001';
const SIP_LIMIT_GS = 10_000_000;

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger('WhatsAppService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly charges: ChargesService,
    private readonly sender: WhatsAppSender,
  ) {}

  /**
   * Punto de entrada: recibe un mensaje entrante, decide qué hacer, responde.
   */
  async handleInbound(fromPhone: string, body: string) {
    const phone = normalizePhone(fromPhone);

    const account = await this.prisma.whatsAppAccount.findUnique({ where: { phone } });

    await this.prisma.whatsAppMessage.create({
      data: {
        direction: WaDirection.INBOUND,
        fromPhone: phone,
        body,
        merchantId: account?.merchantId,
      },
    });

    let reply: string;
    let chargeId: string | undefined;
    let intentLabel: string;

    if (!account || !account.active) {
      intentLabel = 'unauthorized';
      reply = [
        '🚫 Este número no está vinculado a ningún comercio en CobraPy.',
        '',
        'Si sos comercio, vinculá tu número desde el dashboard:',
        `${PUBLIC_BASE_URL}/settings/whatsapp`,
      ].join('\n');
    } else {
      const intent = parseMessage(body);
      intentLabel = intent.kind;

      switch (intent.kind) {
        case 'help':
          reply = this.helpMessage();
          break;
        case 'balance':
          reply = '📊 La función de saldo aún no está disponible. Mientras tanto, abrí el dashboard:\n' + `${PUBLIC_BASE_URL}/dashboard`;
          break;
        case 'charge': {
          if (intent.amountGs > SIP_LIMIT_GS) {
            reply = `❌ El monto excede el límite SIP de Gs. ${SIP_LIMIT_GS.toLocaleString('es-PY')} por operación.`;
          } else {
            const charge = await this.charges.create(account.merchantId, {
              amountGs: intent.amountGs,
              description: intent.description,
            });
            chargeId = charge.id;
            reply = this.chargeReply(charge.id, intent.amountGs, intent.description);
          }
          break;
        }
        case 'unknown':
        default:
          reply = '🤔 No entendí. Escribí *ayuda* para ver los comandos.';
      }
    }

    await this.sender.send({ toPhone: phone, body: reply });

    await this.prisma.whatsAppMessage.create({
      data: {
        direction: WaDirection.OUTBOUND,
        fromPhone: 'cobrapy-bot',
        toPhone: phone,
        body: reply,
        intent: intentLabel,
        chargeId,
        merchantId: account?.merchantId,
      },
    });

    return { intent: intentLabel, reply, chargeId };
  }

  /**
   * Notifica a un comercio cuando un cobro se acreditó. Llamado desde el flow de pago.
   */
  async notifyChargePaid(merchantId: string, chargeId: string, amountGs: number, payerName?: string) {
    const accounts = await this.prisma.whatsAppAccount.findMany({
      where: { merchantId, active: true },
    });
    if (accounts.length === 0) return;

    const body = [
      `💰 *Pago recibido*: Gs. ${amountGs.toLocaleString('es-PY')}`,
      payerName ? `De: ${payerName}` : null,
      `Cobro: ${chargeId.slice(0, 12)}…`,
    ].filter(Boolean).join('\n');

    for (const acc of accounts) {
      await this.sender.send({ toPhone: acc.phone, body });
      await this.prisma.whatsAppMessage.create({
        data: {
          direction: WaDirection.OUTBOUND,
          fromPhone: 'cobrapy-bot',
          toPhone: acc.phone,
          body,
          intent: 'charge.paid',
          chargeId,
          merchantId,
        },
      });
    }
  }

  async linkAccount(merchantId: string, phone: string, userId?: string) {
    const normalized = normalizePhone(phone);
    return this.prisma.whatsAppAccount.upsert({
      where: { phone: normalized },
      create: { phone: normalized, merchantId, userId, verifiedAt: new Date() },
      update: { merchantId, userId, active: true, verifiedAt: new Date() },
    });
  }

  async listAccounts(merchantId: string) {
    return this.prisma.whatsAppAccount.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async unlinkAccount(merchantId: string, id: string) {
    const acc = await this.prisma.whatsAppAccount.findFirst({ where: { id, merchantId } });
    if (!acc) return null;
    return this.prisma.whatsAppAccount.delete({ where: { id } });
  }

  // === templates ===
  private helpMessage() {
    return [
      '🤖 *CobraPy WhatsApp Bot*',
      '',
      'Comandos:',
      '• *cobro 50000* → genera link de pago',
      '• *cobro 50.000 a Juan* → con descripción',
      '• *saldo* → tu actividad de hoy (próximamente)',
      '• *ayuda* → este menú',
      '',
      `Límite SIP: Gs. ${SIP_LIMIT_GS.toLocaleString('es-PY')} por operación.`,
    ].join('\n');
  }

  private chargeReply(chargeId: string, amountGs: number, description?: string) {
    const url = `${PUBLIC_BASE_URL}/p/${chargeId}`;
    return [
      `✅ *Cobro creado: Gs. ${amountGs.toLocaleString('es-PY')}*`,
      description ? `Concepto: ${description}` : null,
      '',
      `Compartí este link con tu cliente:`,
      url,
      '',
      `Vence en 30 minutos. Te aviso por WhatsApp cuando se pague.`,
    ].filter(Boolean).join('\n');
  }
}

function normalizePhone(raw: string): string {
  // Twilio manda "whatsapp:+595981000000". Quitar prefijo y normalizar a E.164.
  const stripped = raw.replace(/^whatsapp:/i, '').trim();
  if (stripped.startsWith('+')) return stripped;
  // Heurística PY: si empieza con "0" lo tratamos como local
  if (stripped.startsWith('0')) return '+595' + stripped.slice(1);
  return stripped;
}
