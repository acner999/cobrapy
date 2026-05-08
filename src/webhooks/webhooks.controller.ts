import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { MerchantId } from '../auth/merchant.decorator';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@ApiTags('webhooks')
@ApiBearerAuth('api-key')
@Controller('webhooks')
@UseGuards(ApiKeyGuard)
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar un endpoint webhook.',
    description: 'Cada evento se firma con HMAC-SHA256 (header `CobraPy-Signature`). Reintentos exponenciales hasta 6 intentos.',
  })
  @ApiCreatedResponse({ description: 'Endpoint creado. El campo `secret` se devuelve UNA SOLA VEZ — guardalo.' })
  create(@MerchantId() merchantId: string, @Body() dto: CreateWebhookDto) {
    return this.webhooks.create(merchantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar endpoints webhook del comercio.' })
  @ApiOkResponse()
  list(@MerchantId() merchantId: string) {
    return this.webhooks.list(merchantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un endpoint webhook.' })
  @ApiNoContentResponse()
  remove(@MerchantId() merchantId: string, @Param('id') id: string) {
    return this.webhooks.remove(merchantId, id);
  }
}
