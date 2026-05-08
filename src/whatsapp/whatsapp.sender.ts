import { Injectable, Logger } from '@nestjs/common';

export interface WhatsAppOutbound {
  toPhone: string;
  body: string;
}

/**
 * Sender abstracto. La implementación default loggea el mensaje.
 * Cuando tengas credenciales de Twilio, reemplazá esta clase con TwilioSender.
 */
@Injectable()
export class WhatsAppSender {
  private readonly logger = new Logger('WhatsAppSender');
  private readonly twilioSid = process.env.TWILIO_ACCOUNT_SID;
  private readonly twilioToken = process.env.TWILIO_AUTH_TOKEN;
  private readonly twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // "whatsapp:+14155238886"

  async send(msg: WhatsAppOutbound): Promise<{ provider: string; ok: boolean }> {
    if (this.twilioSid && this.twilioToken && this.twilioFrom) {
      return this.sendViaTwilio(msg);
    }
    this.logger.log(`[CONSOLE] To ${msg.toPhone}: ${msg.body.replace(/\n/g, ' ⏎ ')}`);
    return { provider: 'console', ok: true };
  }

  private async sendViaTwilio(msg: WhatsAppOutbound): Promise<{ provider: string; ok: boolean }> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioSid}/Messages.json`;
    const auth = Buffer.from(`${this.twilioSid}:${this.twilioToken}`).toString('base64');
    const params = new URLSearchParams({
      From: this.twilioFrom!,
      To: msg.toPhone.startsWith('whatsapp:') ? msg.toPhone : `whatsapp:${msg.toPhone}`,
      Body: msg.body,
    });
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!res.ok) {
      this.logger.warn(`Twilio send failed (${res.status}): ${await res.text()}`);
      return { provider: 'twilio', ok: false };
    }
    return { provider: 'twilio', ok: true };
  }
}
