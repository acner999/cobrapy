import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: string, dto: CreateWebhookDto) {
    const secret = `whsec_${randomBytes(24).toString('base64url')}`;
    return this.prisma.webhookEndpoint.create({
      data: { merchantId, url: dto.url, events: dto.events, secret },
    });
  }

  async list(merchantId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(merchantId: string, id: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({ where: { id, merchantId } });
    if (!endpoint) throw new NotFoundException();
    return this.prisma.webhookEndpoint.delete({ where: { id } });
  }
}
