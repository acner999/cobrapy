import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionSchedulerService } from './subscription-scheduler.service';
import { ChargesModule } from '../charges/charges.module';

@Module({
  imports: [ChargesModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionSchedulerService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
