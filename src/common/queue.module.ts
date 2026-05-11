import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
  };
}

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: parseRedisUrl(process.env.REDIS_URL ?? 'redis://localhost:6379'),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
