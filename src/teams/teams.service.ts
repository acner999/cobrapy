import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MembershipRole } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async listMembers(merchantId: string) {
    return this.prisma.membership.findMany({
      where: { merchantId },
      include: {
        user: { select: { id: true, name: true, email: true, lastLoginAt: true } },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async invite(merchantId: string, invitedBy: string, email: string, role: MembershipRole) {
    if (role === MembershipRole.OWNER) {
      throw new BadRequestException('No se puede invitar a otro OWNER. Transferí la cuenta en su lugar.');
    }
    const lower = email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: lower } });
    if (!user) {
      throw new BadRequestException('Ese usuario aún no tiene cuenta. Pedile que se registre y reenviá la invitación.');
    }
    const existing = await this.prisma.membership.findUnique({
      where: { userId_merchantId: { userId: user.id, merchantId } },
    });
    if (existing) throw new ConflictException('Ese usuario ya es miembro');

    return this.prisma.membership.create({
      data: {
        userId: user.id,
        merchantId,
        role,
        invitedBy,
        acceptedAt: new Date(), // auto-acepto por simplicidad en MVP
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async changeRole(merchantId: string, membershipId: string, role: MembershipRole) {
    const m = await this.prisma.membership.findFirst({ where: { id: membershipId, merchantId } });
    if (!m) throw new NotFoundException();
    if (m.role === MembershipRole.OWNER) throw new BadRequestException('No se puede cambiar el rol del OWNER');
    if (role === MembershipRole.OWNER) throw new BadRequestException('No se puede promover a OWNER directamente');
    return this.prisma.membership.update({ where: { id: membershipId }, data: { role } });
  }

  async remove(merchantId: string, membershipId: string) {
    const m = await this.prisma.membership.findFirst({ where: { id: membershipId, merchantId } });
    if (!m) throw new NotFoundException();
    if (m.role === MembershipRole.OWNER) throw new BadRequestException('No se puede quitar al OWNER');
    return this.prisma.membership.delete({ where: { id: membershipId } });
  }
}
