import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ApiKeyService } from './api-key.service';
import { Environment, MembershipRole, KycStatus } from '@prisma/client';

export interface UserJwtPayload {
  sub: string;          // userId
  email: string;
  mid: string;          // active merchantId
  role: MembershipRole;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  businessName: string;
  ruc: string;
  phone?: string;
}

@Injectable()
export class UserAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly apiKeys: ApiKeyService,
  ) {}

  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();

    const existsUser = await this.prisma.user.findUnique({ where: { email } });
    if (existsUser) throw new ConflictException('Ya existe una cuenta con ese email');

    const existsMerchant = await this.prisma.merchant.findFirst({
      where: { OR: [{ ruc: input.ruc }, { email }] },
    });
    if (existsMerchant) throw new ConflictException('Ya existe un comercio con ese RUC o email');

    const passwordHash = await this.users.hashPassword(input.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: input.name, passwordHash },
      });
      const merchant = await tx.merchant.create({
        data: {
          businessName: input.businessName,
          ruc: input.ruc,
          email,
          phone: input.phone,
          kycStatus: KycStatus.PENDING,
        },
      });
      await tx.membership.create({
        data: {
          userId: user.id,
          merchantId: merchant.id,
          role: MembershipRole.OWNER,
          acceptedAt: new Date(),
        },
      });
      return { user, merchant };
    });

    const apiKey = await this.apiKeys.create(result.merchant.id, 'Default test key', Environment.TEST);
    const token = await this.signFor(result.user.id, result.user.email, result.merchant.id, MembershipRole.OWNER);

    return {
      token,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      merchant: result.merchant,
      apiKey: { id: apiKey.id, secret: apiKey.secret },
    };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.active) throw new UnauthorizedException('Credenciales inválidas');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const memberships = await this.users.listMemberships(user.id);
    if (memberships.length === 0) throw new UnauthorizedException('Tu usuario no tiene comercios asociados');

    const active = memberships[0];
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = await this.signFor(user.id, user.email, active.merchantId, active.role);
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
      activeMerchant: active.merchant,
      memberships: memberships.map((m) => ({
        merchantId: m.merchantId,
        role: m.role,
        merchant: m.merchant,
      })),
    };
  }

  async me(payload: UserJwtPayload) {
    const user = await this.users.findById(payload.sub);
    if (!user) throw new NotFoundException();
    const memberships = await this.users.listMemberships(user.id);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      activeMerchantId: payload.mid,
      activeRole: payload.role,
      memberships: memberships.map((m) => ({ merchantId: m.merchantId, role: m.role, merchant: m.merchant })),
    };
  }

  async switchMerchant(userId: string, merchantId: string) {
    const m = await this.users.assertActiveMembership(userId, merchantId);
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException();
    const token = await this.signFor(user.id, user.email, m.merchantId, m.role);
    return { token, activeMerchantId: m.merchantId, role: m.role };
  }

  async verify(token: string): Promise<UserJwtPayload> {
    return this.jwt.verifyAsync<UserJwtPayload>(token);
  }

  private signFor(userId: string, email: string, mid: string, role: MembershipRole) {
    const payload: UserJwtPayload = { sub: userId, email, mid, role };
    return this.jwt.signAsync(payload);
  }
}
