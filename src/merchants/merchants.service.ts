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

  async listBanks() {
    return this.prisma.bank.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

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

  async update(merchantId: string, data: { email?: string; phone?: string }) {
    return this.prisma.merchant.update({
      where: { id: merchantId },
      data,
    });
  }

  async createBankAccount(merchantId: string, data: { bankCode: string; accountNumber: string; accountAlias?: string; isDefault?: boolean }) {
    if (data.isDefault) {
      await this.prisma.bankAccount.updateMany({
        where: { merchantId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.bankAccount.create({
      data: {
        merchantId,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountAlias: data.accountAlias,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async listBankAccounts(merchantId: string) {
    return this.prisma.bankAccount.findMany({
      where: { merchantId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async deleteBankAccount(merchantId: string, accountId: string) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: accountId, merchantId },
    });
    if (!account) return null;
    return this.prisma.bankAccount.delete({ where: { id: accountId } });
  }

  async updateBankAccount(
    merchantId: string,
    accountId: string,
    data: { bankCode?: string; accountNumber?: string; accountAlias?: string; isDefault?: boolean; documentType?: string; document?: string; nameOrBusinessName?: string },
  ) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: accountId, merchantId },
    });
    if (!account) return null;

    if (data.isDefault) {
      await this.prisma.bankAccount.updateMany({
        where: { merchantId, isDefault: true, id: { not: accountId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.bankAccount.update({
      where: { id: accountId },
      data: {
        ...(data.bankCode && { bankCode: data.bankCode }),
        ...(data.accountNumber && { accountNumber: data.accountNumber }),
        ...(data.accountAlias !== undefined && { accountAlias: data.accountAlias }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.documentType !== undefined && { documentType: data.documentType }),
        ...(data.document !== undefined && { document: data.document }),
        ...(data.nameOrBusinessName !== undefined && { nameOrBusinessName: data.nameOrBusinessName }),
      },
    });
  }
}
