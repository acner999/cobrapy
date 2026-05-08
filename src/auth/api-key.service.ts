import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Environment } from '@prisma/client';

const PREFIX_TEST = 'ck_test_';
const PREFIX_LIVE = 'ck_live_';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, name: string, environment: Environment) {
    const prefix = environment === Environment.LIVE ? PREFIX_LIVE : PREFIX_TEST;
    const secret = randomBytes(24).toString('base64url');
    const fullKey = `${prefix}${secret}`;
    const keyHash = await bcrypt.hash(fullKey, 10);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        merchantId,
        name,
        keyPrefix: prefix,
        keyHash,
        environment,
      },
    });

    // Solo se devuelve en este momento — después no se puede recuperar.
    return { ...apiKey, secret: fullKey };
  }

  async verify(rawKey: string) {
    if (!rawKey.startsWith(PREFIX_TEST) && !rawKey.startsWith(PREFIX_LIVE)) {
      return null;
    }
    const prefix = rawKey.startsWith(PREFIX_LIVE) ? PREFIX_LIVE : PREFIX_TEST;

    const candidates = await this.prisma.apiKey.findMany({
      where: { keyPrefix: prefix, revokedAt: null },
      include: { merchant: true },
    });

    for (const candidate of candidates) {
      const ok = await bcrypt.compare(rawKey, candidate.keyHash);
      if (ok && candidate.merchant.active) {
        await this.prisma.apiKey.update({
          where: { id: candidate.id },
          data: { lastUsedAt: new Date() },
        });
        return candidate;
      }
    }
    return null;
  }

  async revoke(id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
