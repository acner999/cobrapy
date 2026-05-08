import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

interface QrInput {
  chargeId: string;
  amountGs: number;
  merchantName: string;
  description?: string;
}

interface QrResult {
  payload: string;
  dataUrl: string;
}

// Generador de QR EMVCo (Merchant Presented Mode) compatible con el QR Hub del SIP.
// Spec: EMV QR Code Specification for Payment Systems v1.1.
// Cada campo TLV: ID(2) + LENGTH(2) + VALUE.
// El payload final lleva un CRC16-CCITT (poly 0x1021) sobre todo el contenido previo + "6304".
//
// IMPORTANTE: el GUI del Merchant Account Information (campo 26) y el código de país/moneda
// usan placeholders. El BCP publicará el GUI oficial del SIP — hay que reemplazarlo cuando
// salga la documentación técnica del QR Hub. Hoy esto es funcional para sandbox y testing.
@Injectable()
export class QrService {
  private readonly SIP_GUI = 'py.gov.bcp.sip'; // placeholder hasta confirmar GUI oficial
  private readonly COUNTRY_CODE = 'PY';
  private readonly CURRENCY_CODE = '600'; // ISO 4217 numérico para PYG

  async generateForCharge(input: QrInput): Promise<QrResult> {
    const payload = this.buildEmvPayload(input);
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 512,
    });
    return { payload, dataUrl };
  }

  private buildEmvPayload(input: QrInput): string {
    const merchantInfo = this.tlv('00', this.SIP_GUI) + this.tlv('01', input.chargeId);

    const additionalData = this.tlv('05', input.chargeId.slice(0, 25)); // bill number

    const fields = [
      this.tlv('00', '01'),                              // Payload Format Indicator
      this.tlv('01', '12'),                              // Point of Initiation = dynamic
      this.tlv('26', merchantInfo),                      // Merchant Account Info (SIP)
      this.tlv('52', '0000'),                            // Merchant Category Code (genérico)
      this.tlv('53', this.CURRENCY_CODE),                // Transaction Currency
      this.tlv('54', input.amountGs.toString()),         // Transaction Amount
      this.tlv('58', this.COUNTRY_CODE),                 // Country Code
      this.tlv('59', this.truncate(input.merchantName, 25)),
      this.tlv('60', 'ASUNCION'),                        // Merchant City
      this.tlv('62', additionalData),                    // Additional Data
    ];

    const base = fields.join('') + '6304';
    const crc = this.crc16(base);
    return base + crc;
  }

  private tlv(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  private truncate(s: string, n: number): string {
    return s.length > n ? s.slice(0, n) : s;
  }

  private crc16(data: string): string {
    let crc = 0xffff;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
}
