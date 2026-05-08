import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ulid } from 'ulid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request & { requestId?: string }, res: Response, next: NextFunction) {
    const incoming = req.header('x-request-id');
    const requestId = incoming ?? ulid();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const code = res.statusCode;
      const line = `${req.method} ${req.originalUrl} ${code} ${ms}ms req=${requestId}`;
      if (code >= 500) this.logger.error(line);
      else if (code >= 400) this.logger.warn(line);
      else this.logger.log(line);
    });

    next();
  }
}
