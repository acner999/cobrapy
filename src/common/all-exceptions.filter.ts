import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  requestId?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { requestId?: string }>();

    const { status, error, message } = this.normalize(exception);

    const body: ErrorBody = {
      statusCode: status,
      error,
      message,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      path: req.url,
    };

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} → ${status} ${error} (req=${req.requestId ?? '-'})`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (status >= 400) {
      this.logger.warn(`${req.method} ${req.url} → ${status} ${error} (req=${req.requestId ?? '-'})`);
    }

    res.status(status).json(body);
  }

  private normalize(exception: unknown): { status: number; error: string; message: string | string[] } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const status = exception.getStatus();
      if (typeof response === 'string') {
        return { status, error: exception.name, message: response };
      }
      const r = response as { error?: string; message?: string | string[] };
      return {
        status,
        error: r.error ?? exception.name,
        message: r.message ?? exception.message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 = unique constraint, P2025 = not found
      if (exception.code === 'P2002') {
        return { status: HttpStatus.CONFLICT, error: 'Conflict', message: 'Resource already exists' };
      }
      if (exception.code === 'P2025') {
        return { status: HttpStatus.NOT_FOUND, error: 'Not Found', message: 'Resource not found' };
      }
      return { status: HttpStatus.BAD_REQUEST, error: 'Database Error', message: `Prisma error ${exception.code}` };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return { status: HttpStatus.BAD_REQUEST, error: 'Validation Error', message: 'Invalid query input' };
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', message: 'Unexpected server error' };
  }
}
