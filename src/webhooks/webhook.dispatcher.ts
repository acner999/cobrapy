import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WEBHOOK_QUEUE } from './webhooks.constants';

export interface WebhookJobData {
  deliveryId: string;
}

@Injectable()
export class WebhookDispatcher {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(WEBHOOK_QUEUE) private readonly queue: Queue<WebhookJobData>,
  ) {}

  async dispatch(merchantId: string, eventType: string, payload: Record<string, unknown>) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { merchantId, active: true, events: { has: eventType } },
    });

    const event = { id: `evt_${Date.now()}`, type: eventType, createdAt: new Date().toISOString(), data: payload };

    for (const endpoint of endpoints) {
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          eventType,
          payload: event as never,
        },
      });
      await this.queue.add('deliver', { deliveryId: delivery.id }, {
        attempts: 6,
        backoff: { type: 'exponential', delay: 2_000 }, // 2s, 4s, 8s, 16s, 32s, 64s
        removeOnComplete: 1000,
        removeOnFail: 5000,
      });
    }
  }
}
