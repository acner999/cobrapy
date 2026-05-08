import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { createHmac } from 'crypto';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { WEBHOOK_QUEUE } from './webhooks.constants';
import { WebhookJobData } from './webhook.dispatcher';
import { DeliveryStatus } from '@prisma/client';

@Processor(WEBHOOK_QUEUE)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly prisma: PrismaService) { super(); }

  async process(job: Job<WebhookJobData>): Promise<void> {
    const { deliveryId } = job.data;
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { endpoint: true },
    });
    if (!delivery || !delivery.endpoint.active) return;

    const body = JSON.stringify(delivery.payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac('sha256', delivery.endpoint.secret)
      .update(`${timestamp}.${body}`)
      .digest('hex');

    try {
      const res = await axios.post(delivery.endpoint.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'CobraPy-Signature': `t=${timestamp},v1=${signature}`,
          'CobraPy-Event': delivery.eventType,
          'User-Agent': 'CobraPy-Webhooks/1.0',
        },
        timeout: 10_000,
        validateStatus: () => true,
      });

      const ok = res.status >= 200 && res.status < 300;
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: ok ? DeliveryStatus.DELIVERED : DeliveryStatus.PENDING,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          responseStatus: res.status,
          responseBody: typeof res.data === 'string' ? res.data.slice(0, 2000) : JSON.stringify(res.data).slice(0, 2000),
        },
      });

      if (!ok) throw new Error(`Non-2xx response: ${res.status}`);
    } catch (err) {
      this.logger.warn(`Webhook delivery ${deliveryId} failed: ${(err as Error).message}`);
      // Si llegamos al último intento, marcamos como ABANDONED.
      if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: { status: DeliveryStatus.ABANDONED },
        });
      }
      throw err;
    }
  }
}
