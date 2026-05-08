import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookDispatcher } from './webhook.dispatcher';
import { WebhookProcessor } from './webhook.processor';
import { WEBHOOK_QUEUE } from './webhooks.constants';

@Module({
  imports: [BullModule.registerQueue({ name: WEBHOOK_QUEUE })],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookDispatcher, WebhookProcessor],
  exports: [WebhookDispatcher],
})
export class WebhooksModule {}
