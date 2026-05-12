import { Injectable, Logger } from '@nestjs/common';
import { SipAdapter, SipInitiateRequest, SipInitiateResponse } from '../sip.types';
import { ulid } from 'ulid';

@Injectable()
export class MockSipAdapter implements SipAdapter {
  private readonly logger = new Logger(MockSipAdapter.name);

  async initiatePayment(req: SipInitiateRequest): Promise<SipInitiateResponse> {
    this.logger.log(`[MOCK SIP] Iniciando pago ${req.reference} por ₲${req.amountGs}`);
    await new Promise(r => setTimeout(r, 200));
    return {
      sipTransactionId: `SIP-MOCK-${ulid()}`,
      status: 'PENDING',
    };
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    // En mock siempre válido
    return true;
  }
}
