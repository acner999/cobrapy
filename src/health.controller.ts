import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiServiceUnavailableResponse } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import Redis from 'ioredis';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica que la API y sus dependencias (DB, Redis) estén operativas.' })
  @ApiOkResponse({ description: 'Todo funcionando.' })
  @ApiServiceUnavailableResponse({ description: 'Alguna dependencia caída.' })
  async check() {
    const checks = await Promise.allSettled([this.checkDb(), this.checkRedis()]);
    const db = checks[0].status === 'fulfilled' ? 'up' : 'down';
    const redis = checks[1].status === 'fulfilled' ? 'up' : 'down';

    const ok = db === 'up' && redis === 'up';
    const body = {
      status: ok ? 'ok' : 'degraded',
      service: 'cobrapy-api',
      timestamp: new Date().toISOString(),
      checks: { db, redis },
    };
    if (!ok) throw new ServiceUnavailableException(body);
    return body;
  }

  private async checkDb() {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis() {
    const redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
    });
    try {
      await redis.connect();
      await redis.ping();
    } finally {
      redis.disconnect();
    }
  }
}
