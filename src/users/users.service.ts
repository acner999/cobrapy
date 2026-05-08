import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  hashPassword(plain: string) {
    return bcrypt.hash(plain, 10);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async listMemberships(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId, acceptedAt: { not: null } },
      include: {
        merchant: { select: { id: true, businessName: true, ruc: true, kycStatus: true, plan: true, active: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMembership(userId: string, merchantId: string) {
    return this.prisma.membership.findUnique({
      where: { userId_merchantId: { userId, merchantId } },
    });
  }

  async assertActiveMembership(userId: string, merchantId: string) {
    const m = await this.getMembership(userId, merchantId);
    if (!m || !m.acceptedAt) throw new NotFoundException('Membership not found or not accepted');
    return m;
  }

  hasMinimumRole(role: MembershipRole, required: MembershipRole): boolean {
    const order: Record<MembershipRole, number> = { OWNER: 4, ADMIN: 3, OPERATOR: 2, READONLY: 1 };
    return order[role] >= order[required];
  }
}
