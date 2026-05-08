import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KycStatus } from '@prisma/client';

@Injectable()
export class AdminMerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { search?: string; kycStatus?: KycStatus; limit?: number }) {
    const merchants = await this.prisma.merchant.findMany({
      where: {
        ...(opts.kycStatus ? { kycStatus: opts.kycStatus } : {}),
        ...(opts.search ? {
          OR: [
            { businessName: { contains: opts.search, mode: 'insensitive' } },
            { ruc: { contains: opts.search } },
            { email: { contains: opts.search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(opts.limit ?? 100, 500),
      include: { _count: { select: { charges: true } } },
    });
    return merchants;
  }

  async findById(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        _count: { select: { charges: true, apiKeys: true, webhooks: true } },
        bankAccounts: true,
      },
    });
    if (!merchant) throw new NotFoundException();
    return merchant;
  }

  async approveKyc(id: string) {
    return this.prisma.merchant.update({
      where: { id },
      data: { kycStatus: KycStatus.APPROVED },
    });
  }

  async rejectKyc(id: string) {
    return this.prisma.merchant.update({
      where: { id },
      data: { kycStatus: KycStatus.REJECTED },
    });
  }

  async setActive(id: string, active: boolean) {
    return this.prisma.merchant.update({ where: { id }, data: { active } });
  }
}
