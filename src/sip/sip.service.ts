import { Inject, Injectable, Logger } from '@nestjs/common';
import { SipAdapter, SipInitiateRequest, SipInitiateResponse, SipWebhookPayload } from './sip.types';

export const SIP_ADAPTER = 'SIP_ADAPTER';

@Injectable()
export class SipService {
  private readonly logger = new Logger(SipService.name);

  constructor(@Inject(SIP_ADAPTER) private readonly adapter: SipAdapter) {}

  initiatePayment(req: SipInitiateRequest): Promise<SipInitiateResponse> {
    return this.adapter.initiatePayment(req);
  }

  verifyWebhook(rawBody: string, signature: string): boolean {
    return this.adapter.verifyWebhookSignature(rawBody, signature);
  }

  parseWebhookPayload(rawBody: string): SipWebhookPayload {
    return JSON.parse(rawBody) as SipWebhookPayload;
  }
}
