import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthService, AdminJwtPayload } from './admin-auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { admin?: AdminJwtPayload }>();
    const header = req.header('authorization') ?? '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new UnauthorizedException('Missing admin token');

    try {
      const payload = await this.auth.verify(match[1]);
      req.admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid admin token');
    }
  }
}
