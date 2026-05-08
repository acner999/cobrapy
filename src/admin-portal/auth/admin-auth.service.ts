import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminRole } from '@prisma/client';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.active) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

    const payload: AdminJwtPayload = { sub: admin.id, email: admin.email, role: admin.role };
    const token = await this.jwt.signAsync(payload);

    return {
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    };
  }

  async verify(token: string): Promise<AdminJwtPayload> {
    return this.jwt.verifyAsync<AdminJwtPayload>(token);
  }
}
