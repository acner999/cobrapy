import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PaymentLinksService } from './payment-links.service';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { MerchantId } from '../auth/merchant.decorator';

@ApiExcludeController()
@Controller('payment-links')
@UseGuards(ApiKeyGuard)
export class PaymentLinksController {
  constructor(private readonly paymentLinks: PaymentLinksService) {}

  @Post()
  create(@MerchantId() merchantId: string, @Body() dto: CreatePaymentLinkDto) {
    return this.paymentLinks.create(merchantId, dto);
  }

  @Get()
  list(@MerchantId() merchantId: string) {
    return this.paymentLinks.list(merchantId);
  }

  @Get(':id')
  findOne(@MerchantId() merchantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.paymentLinks.findOne(merchantId, id);
  }

  @Post(':id/deactivate')
  deactivate(@MerchantId() merchantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.paymentLinks.deactivate(merchantId, id);
  }
}

@ApiExcludeController()
@Controller({ path: 'p', version: '1' })
export class PublicPaymentLinkController {
  constructor(private readonly paymentLinks: PaymentLinksService) {}

  @Get(':slug(.*)')
  async findBySlug(@Param('slug') slug: string) {
    console.log('Received slug:', slug);
    try {
      const link = await this.paymentLinks.findBySlug(slug);
      if (!link) {
        return { error: 'Payment link not found', status: 404 };
      }
      if (!link.active) {
        return { error: 'Payment link is inactive', status: 410 };
      }
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return { error: 'Payment link has expired', status: 410 };
      }
      if (link.maxUses && link.usesCount >= link.maxUses) {
        return { error: 'Payment link has reached maximum uses', status: 410 };
      }
      return {
        id: link.id,
        slug: link.slug,
        title: link.title,
        amountGs: link.amountGs ? Number(link.amountGs) : null,
        description: link.description,
        expiresAt: link.expiresAt?.toISOString() ?? null,
        maxUses: link.maxUses,
        usesCount: link.usesCount,
        active: link.active,
        merchant: {
          businessName: link.merchant.businessName,
        },
      };
    } catch (err) {
      console.error('Error finding payment link:', err);
      return { error: 'Internal server error', status: 500 };
    }
  }
}