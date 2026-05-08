import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const MerchantId = createParamDecorator((_, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request & { merchantId?: string }>();
  if (!req.merchantId) {
    throw new Error('MerchantId decorator used on unauthenticated route');
  }
  return req.merchantId;
});
