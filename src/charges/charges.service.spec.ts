import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChargesService } from './charges.service';
import { ChargeStatus, PaymentType, TransactionStatus } from '@prisma/client';

type AnyFn = (...args: unknown[]) => unknown;
const mockFn = () => vi.fn() as unknown as AnyFn;

function buildPrismaMock() {
  return {
    merchant: { findUnique: vi.fn() },
    charge: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
    ledgerEntry: { createMany: vi.fn() },
    $transaction: vi.fn(),
  };
}

describe('ChargesService', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let qr: { generateForCharge: ReturnType<typeof vi.fn> };
  let webhooks: { dispatch: ReturnType<typeof vi.fn> };
  let service: ChargesService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    qr = { generateForCharge: vi.fn().mockResolvedValue({ payload: 'p', dataUrl: 'd' }) };
    webhooks = { dispatch: vi.fn().mockResolvedValue(undefined) };
    service = new ChargesService(prisma as never, qr as never, webhooks as never);
  });

  describe('create', () => {
    it('creates a charge with QR for a valid merchant', async () => {
      prisma.merchant.findUnique.mockResolvedValue({ id: 'm1', businessName: 'X' });
      prisma.charge.create.mockResolvedValue({ id: 'c1', merchantId: 'm1', amountGs: 50000n });
      prisma.charge.update.mockResolvedValue({ id: 'c1', merchantId: 'm1', amountGs: 50000n, qrPayload: 'p', qrImageUrl: 'd' });

      const result = await service.create('m1', { amountGs: 50000 });

      expect(prisma.charge.create).toHaveBeenCalled();
      expect(qr.generateForCharge).toHaveBeenCalledWith(expect.objectContaining({ amountGs: 50000, merchantName: 'X' }));
      expect(result.amountGs).toBe(50000); // BigInt → number serialization
    });

    it('rejects when merchant does not exist', async () => {
      prisma.merchant.findUnique.mockResolvedValue(null);
      await expect(service.create('missing', { amountGs: 1000 })).rejects.toThrow(/Merchant not found/);
    });

    it('returns existing charge when externalId already used (idempotency)', async () => {
      prisma.merchant.findUnique.mockResolvedValue({ id: 'm1', businessName: 'X' });
      prisma.charge.findUnique.mockResolvedValue({ id: 'c-existing', merchantId: 'm1', amountGs: 99000n });

      const result = await service.create('m1', { amountGs: 50000, externalId: 'order-42' });

      expect(result.id).toBe('c-existing');
      expect(prisma.charge.create).not.toHaveBeenCalled();
    });
  });

  describe('markPaid', () => {
    it('writes a balanced double-entry ledger and dispatches webhook', async () => {
      prisma.charge.findUnique.mockResolvedValue({
        id: 'c1', merchantId: 'm1', amountGs: 100000n, status: ChargeStatus.PENDING,
      });

      // Simulate $transaction by invoking the callback with the mocked tx client.
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          charge: { update: vi.fn().mockResolvedValue({ id: 'c1', merchantId: 'm1', amountGs: 100000n, status: ChargeStatus.PAID }) },
          transaction: { create: vi.fn().mockResolvedValue({ id: 't1' }) },
          ledgerEntry: { createMany: vi.fn().mockResolvedValue({ count: 3 }) },
        };
        const result = await fn(tx);
        // Capture for assertions
        (prisma as unknown as { _capturedTx?: unknown })._capturedTx = tx;
        return result;
      });

      await service.markPaid('c1', { sipTransactionId: 'sip_123' });

      const tx = (prisma as unknown as { _capturedTx: {
        ledgerEntry: { createMany: { mock: { calls: [[{ data: Array<{ debitGs: bigint; creditGs: bigint }> }]] } } };
      } })._capturedTx;
      const entries = tx.ledgerEntry.createMany.mock.calls[0][0].data;

      const totalDebit = entries.reduce((a, e) => a + e.debitGs, 0n);
      const totalCredit = entries.reduce((a, e) => a + e.creditGs, 0n);
      expect(totalDebit).toBe(totalCredit); // ledger must balance

      // Fee 0.5% of 100.000 = 500
      const feeEntry = entries.find((e) => e.creditGs === 500n);
      expect(feeEntry).toBeDefined();
      // Net to merchant = 99.500
      const netEntry = entries.find((e) => e.creditGs === 99500n);
      expect(netEntry).toBeDefined();

      expect(webhooks.dispatch).toHaveBeenCalledWith('m1', 'charge.paid', expect.objectContaining({
        chargeId: 'c1', amountGs: 100000, feeGs: 500, netAmountGs: 99500,
      }));
    });

    it('rejects double-payment of the same charge', async () => {
      prisma.charge.findUnique.mockResolvedValue({
        id: 'c1', merchantId: 'm1', amountGs: 50000n, status: ChargeStatus.PAID,
      });
      await expect(service.markPaid('c1', { sipTransactionId: 'x' })).rejects.toThrow(/already paid/);
    });
  });
});
