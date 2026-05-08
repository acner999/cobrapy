import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService } from './api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.header('authorization') ?? '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const rawKey = match?.[1] ?? req.header('x-api-key');

    if (!rawKey) throw new UnauthorizedException('Missing API key');

    const apiKey = await this.apiKeys.verify(rawKey);
    if (!apiKey) throw new UnauthorizedException('Invalid API key');

    (req as Request & { merchantId?: string; apiKeyId?: string }).merchantId = apiKey.merchantId;
    (req as Request & { merchantId?: string; apiKeyId?: string }).apiKeyId = apiKey.id;
    return true;
  }
}
