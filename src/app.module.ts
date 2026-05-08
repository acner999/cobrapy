import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './common/queue.module';
import { AuthModule } from './auth/auth.module';
import { MerchantsModule } from './merchants/merchants.module';
import { ChargesModule } from './charges/charges.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AdminModule } from './admin/admin.module';
import { AdminPortalModule } from './admin-portal/admin-portal.module';
import { PaymentLinksModule } from './payment-links/payment-links.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { HealthController } from './health.controller';
import { RequestIdMiddleware } from './common/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    QueueModule,
    UsersModule,
    AuthModule,
    TeamsModule,
    MerchantsModule,
    ChargesModule,
    WebhooksModule,
    AdminModule,
    AdminPortalModule,
    PaymentLinksModule,
    WhatsAppModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
