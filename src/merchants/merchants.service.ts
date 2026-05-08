import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeyService } from '../auth/api-key.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { Environment } from '@prisma/client';

@Injectable()
export class MerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeys: ApiKeyService,
  ) {}

  async create(dto: CreateMerchantDto) {
    const existing = await this.prisma.merchant.findFirst({
      where: { OR: [{ ruc: dto.ruc }, { email: dto.email }] },
    });
    if (existing) throw new ConflictException('Merchant with this RUC or email already exists');

    const merchant = await this.prisma.merchant.create({ data: dto });
    const apiKey = await this.apiKeys.create(merchant.id, 'Default test key', Environment.TEST);

    return { merchant, apiKey: { id: apiKey.id, secret: apiKey.secret, name: apiKey.name } };
  }

  async findById(id: string) {
    return this.prisma.merchant.findUnique({ where: { id } });
  }

  async listApiKeys(merchantId: string) {
    return this.prisma.apiKey.findMany({
      where: { merchantId },
      select: {
        id: true, name: true, keyPrefix: true, environment: true,
        lastUsedAt: true, revokedAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
