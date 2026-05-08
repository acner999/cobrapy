import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChargeStatus } from '@prisma/client';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [merchantsCount, activeMerchants, charges30d, paidCharges, pendingKyc, ledgerFees] = await Promise.all([
      this.prisma.merchant.count(),
      this.prisma.merchant.count({ where: { active: true } }),
      this.prisma.charge.count({ where: { createdAt: { gte: since30d } } }),
      this.prisma.charge.findMany({
        where: { status: ChargeStatus.PAID, createdAt: { gte: since30d } },
        select: { amountGs: true },
      }),
      this.prisma.merchant.count({ where: { kycStatus: 'PENDING' } }),
      this.prisma.ledgerEntry.aggregate({
        where: { account: 'cobrapy:fees', createdAt: { gte: since30d } },
        _sum: { creditGs: true },
      }),
    ]);

    const volume30d = paidCharges.reduce((s, c) => s + c.amountGs, 0n);
    const fees30d = ledgerFees._sum.creditGs ?? 0n;

    return {
      merchants: { total: merchantsCount, active: activeMerchants, pendingKyc },
      last30d: {
        chargesCreated: charges30d,
        chargesPaid: paidCharges.length,
        volumeGs: Number(volume30d),
        feesGs: Number(fees30d),
      },
    };
  }

  async recentCharges(limit = 50) {
    const charges = await this.prisma.charge.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      include: { merchant: { select: { businessName: true, ruc: true } } },
    });
    return charges.map((c) => ({ ...c, amountGs: Number(c.amountGs) }));
  }
}
