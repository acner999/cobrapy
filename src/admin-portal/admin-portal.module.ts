import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminGuard } from './auth/admin.guard';
import { AdminMerchantsController } from './merchants/admin-merchants.controller';
import { AdminMerchantsService } from './merchants/admin-merchants.service';
import { AdminStatsController } from './stats/admin-stats.controller';
import { AdminStatsService } from './stats/admin-stats.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AdminAuthController, AdminMerchantsController, AdminStatsController],
  providers: [AdminAuthService, AdminGuard, AdminMerchantsService, AdminStatsService],
})
export class AdminPortalModule {}
