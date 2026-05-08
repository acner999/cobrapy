import { describe, it, expect, beforeEach } from 'vitest';
import { QrService } from './qr.service';

describe('QrService', () => {
  let service: QrService;

  beforeEach(() => {
    service = new QrService();
  });

  describe('generateForCharge', () => {
    it('returns a payload string and a PNG data URL', async () => {
      const result = await service.generateForCharge({
        chargeId: 'cmtest1234567890',
        amountGs: 50000,
        merchantName: 'Demo',
      });

      expect(typeof result.payload).toBe('string');
      expect(result.payload.length).toBeGreaterThan(50);
      expect(result.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    });

    it('embeds the amount in the payload (field 54)', async () => {
      const result = await service.generateForCharge({
        chargeId: 'cmtest1234567890',
        amountGs: 12345,
        merchantName: 'Demo',
      });

      // EMVCo field 54 = transaction amount, length-prefixed string of digits.
      expect(result.payload).toContain('540512345');
    });

    it('embeds the chargeId in additional data (field 62 → subfield 05)', async () => {
      const result = await service.generateForCharge({
        chargeId: 'cmtest1234567890',
        amountGs: 1000,
        merchantName: 'Demo',
      });

      expect(result.payload).toContain('cmtest1234567890');
    });

    it('produces an EMVCo-valid CRC16 footer', async () => {
      const { payload } = await service.generateForCharge({
        chargeId: 'cmtest1234567890',
        amountGs: 50000,
        merchantName: 'Demo',
      });

      // Last 8 chars are "6304" + 4 hex digits of CRC16
      expect(payload.slice(-8, -4)).toBe('6304');
      const declared = payload.slice(-4);
      const computed = crc16(payload.slice(0, -4));
      expect(declared).toBe(computed);
    });

    it('truncates merchant name to 25 chars (EMVCo field 59 limit)', async () => {
      const longName = 'Comercio Demo Cobrapy Asuncion 12345';
      const result = await service.generateForCharge({
        chargeId: 'cmtest1234567890',
        amountGs: 1000,
        merchantName: longName,
      });

      // Field 59 has length 25 → "5925<25-char-truncated-name>"
      expect(result.payload).toContain('5925');
    });
  });
});

// CRC16-CCITT (poly 0x1021, init 0xffff) — replicada para validar el output.
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
