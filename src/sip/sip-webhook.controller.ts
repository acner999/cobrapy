import { Controller, Post, Headers, RawBodyRequest, Req, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { SipService } from './sip.service';
import { ChargesService } from '../charges/charges.service';

@ApiTags('sip')
@Controller('sip')
export class SipWebhookController {
  private readonly logger = new Logger(SipWebhookController.name);

  constructor(
    private readonly sip: SipService,
    private readonly charges: ChargesService,
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Callback del BCP/SIP cuando confirma o revierte un pago.' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-sip-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString() ?? '';

    if (!this.sip.verifyWebhook(rawBody, signature ?? '')) {
      this.logger.warn('SIP webhook con firma inválida rechazado');
      throw new BadRequestException('Invalid signature');
    }

    const payload = this.sip.parseWebhookPayload(rawBody);
    this.logger.log(`SIP webhook: ${payload.status} para charge ${payload.reference}`);

    if (payload.status === 'COMPLETED') {
      await this.charges.markPaid(payload.reference, {
        sipTransactionId: payload.sipTransactionId,
        payerName:        payload.payerName,
        payerDocument:    payload.payerDocument,
        payerBankCode:    payload.payerBankCode,
      });
    }

    return { received: true };
  }
}
