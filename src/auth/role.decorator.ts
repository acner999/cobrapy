import { SetMetadata, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { MembershipRole } from '@prisma/client';
import { UsersService } from '../users/users.service';

export const ROLES_KEY = 'requiredRole';

/** Marca el endpoint como requerimiento mínimo de rol. Ej: @RequireRole('ADMIN') */
export const RequireRole = (role: MembershipRole) => SetMetadata(ROLES_KEY, role);

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<MembershipRole | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const req = context.switchToHttp().getRequest<Request & { membershipRole?: MembershipRole }>();
    const role = req.membershipRole;
    if (!role) throw new ForbiddenException('Sin rol asignado');
    if (!this.users.hasMinimumRole(role, required)) {
      throw new ForbiddenException(`Se requiere rol ${required} o superior (actual: ${role})`);
    }
    return true;
  }
}
