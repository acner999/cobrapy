import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService } from './api-key.service';
import { UserAuthService, UserJwtPayload } from './user-auth.service';
import { UsersService } from '../users/users.service';
import { MembershipRole } from '@prisma/client';

/**
 * Guard dual: acepta tanto API key (server-to-server) como JWT de usuario (dashboard).
 * Mantiene el nombre `ApiKeyGuard` para evitar refactorizar todos los controllers.
 *
 * Setea en el request:
 *   - merchantId: id del merchant activo
 *   - apiKeyId: si vino por API key
 *   - userId: si vino por JWT de usuario
 *   - userPayload: payload completo del JWT (cuando aplica)
 *   - membershipRole: rol efectivo del request (OWNER si vino por API key)
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeys: ApiKeyService,
    private readonly userAuth: UserAuthService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & {
      merchantId?: string;
      apiKeyId?: string;
      userId?: string;
      userPayload?: UserJwtPayload;
      membershipRole?: MembershipRole;
    }>();
    const header = req.header('authorization') ?? '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const raw = match?.[1] ?? req.header('x-api-key');
    if (!raw) throw new UnauthorizedException('Missing credentials');

    // 1. Si parece API key (ck_test_ / ck_live_)
    if (raw.startsWith('ck_test_') || raw.startsWith('ck_live_')) {
      const apiKey = await this.apiKeys.verify(raw);
      if (!apiKey) throw new UnauthorizedException('Invalid API key');
      req.merchantId = apiKey.merchantId;
      req.apiKeyId = apiKey.id;
      req.membershipRole = MembershipRole.OWNER; // API key = full permisos
      return true;
    }

    // 2. JWT de usuario
    try {
      const payload = await this.userAuth.verify(raw);
      const membership = await this.users.getMembership(payload.sub, payload.mid);
      if (!membership || !membership.acceptedAt) throw new UnauthorizedException('Membership inválida');
      req.userId = payload.sub;
      req.userPayload = payload;
      req.merchantId = payload.mid;
      req.membershipRole = membership.role;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
