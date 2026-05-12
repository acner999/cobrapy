export interface SipInitiateRequest {
  reference: string;       // charge ID — usado para idempotencia
  amountGs: number;
  creditorAccountNumber: string;
  creditorBankCode: string;
  creditorName: string;
  creditorDocument: string;
  description: string;
}

export interface SipInitiateResponse {
  sipTransactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  message?: string;
}

export interface SipWebhookPayload {
  sipTransactionId: string;
  reference: string;
  amountGs: number;
  status: 'COMPLETED' | 'REVERSED' | 'FAILED';
  payerName?: string;
  payerDocument?: string;
  payerBankCode?: string;
  occurredAt: string;
  signature: string;
}

export interface SipAdapter {
  initiatePayment(req: SipInitiateRequest): Promise<SipInitiateResponse>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}
