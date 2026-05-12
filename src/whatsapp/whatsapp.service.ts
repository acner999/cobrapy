import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChargesService } from '../charges/charges.service';
import { WhatsAppSender } from './whatsapp.sender';
import { parseMessage } from './whatsapp.parser';
import { WaDirection } from '@prisma/client';

const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const SIP_LIMIT_GS = 10_000_000;

@Injectable()
export class WhatsAppService {
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
    if (!isValidPyMobile(normalized)) {
      throw new Error(`Número inválido: ${phone}. Usá el formato +595XXXXXXXXX (celular paraguayo).`);
    }
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
    const url = `${PUBLIC_BASE_URL}/pay/${chargeId}`;
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

// Prefijos de operadoras celulares de Paraguay (sin el 0 inicial)
const PY_MOBILE_PREFIXES = /^9(6[1-6]|7[1-9]|8[0-9]|9[0-9])/;

export function normalizePhone(raw: string): string {
  // Quitar prefijo Twilio y cualquier carácter no numérico excepto el + inicial
  const clean = raw.replace(/^whatsapp:/i, '').replace(/[\s\-().]/g, '').trim();
  const digits = clean.replace(/^\+/, '');

  // +595XXXXXXXXX o 595XXXXXXXXX (12 dígitos con código país)
  if (digits.startsWith('595') && digits.length === 12) return '+' + digits;

  // 0XXXXXXXXX (10 dígitos, formato local PY con 0)
  if (digits.startsWith('0') && digits.length === 10) return '+595' + digits.slice(1);

  // XXXXXXXXX (9 dígitos, sin 0 ni código país)
  if (digits.length === 9 && PY_MOBILE_PREFIXES.test(digits)) return '+595' + digits;

  // Ya venía con + y no matcheó arriba → devolver tal cual
  if (clean.startsWith('+')) return clean;

  return '+595' + digits;
}

export function isValidPyMobile(e164: string): boolean {
  // +595 seguido de 9 dígitos que empiezan con prefijo de celular PY
  const m = e164.match(/^\+595(\d{9})$/);
  return !!m && PY_MOBILE_PREFIXES.test(m[1]);
}
