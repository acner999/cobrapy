import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import axios from 'axios';
import { SipAdapter, SipInitiateRequest, SipInitiateResponse } from '../sip.types';

/**
 * Adapter real para el SIP del BCP (Paraguay).
 * Requiere credenciales otorgadas por BCP al registrarse como PISP:
 *   SIP_BASE_URL, SIP_CLIENT_ID, SIP_CLIENT_SECRET, SIP_WEBHOOK_SECRET
 *
 * Documentación: https://www.bcp.gov.py/sip (acceso por convenio)
 */
@Injectable()
export class BcpSipAdapter implements SipAdapter {
  private readonly logger = new Logger(BcpSipAdapter.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl       = config.getOrThrow('SIP_BASE_URL');
    this.clientId      = config.getOrThrow('SIP_CLIENT_ID');
    this.clientSecret  = config.getOrThrow('SIP_CLIENT_SECRET');
    this.webhookSecret = config.getOrThrow('SIP_WEBHOOK_SECRET');
  }

  async initiatePayment(req: SipInitiateRequest): Promise<SipInitiateResponse> {
    const token = await this.getAccessToken();

    const { data } = await axios.post(
      `${this.baseUrl}/v1/payments/initiate`,
      {
        externalId:            req.reference,
        amount:                req.amountGs,
        currency:              'PYG',
        creditorAccount:       req.creditorAccountNumber,
        creditorInstitution:   req.creditorBankCode,
        creditorName:          req.creditorName,
        creditorDocument:      req.creditorDocument,
        remittanceInformation: req.description,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return {
      sipTransactionId: data.transactionId,
      status: data.status,
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expected = createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    return expected === signature;
  }

  private async getAccessToken(): Promise<string> {
    const { data } = await axios.post(`${this.baseUrl}/oauth/token`, {
      grant_type:    'client_credentials',
      client_id:     this.clientId,
      client_secret: this.clientSecret,
      scope:         'payments:write',
    });
    return data.access_token;
  }
}
