import { Body, Controller, Get, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiConflictResponse } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { MerchantId } from '../auth/merchant.decorator';

@ApiTags('merchants')
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchants: MerchantsService) {}

  @Post()
  @ApiOperation({
    summary: 'Onboarding público — crear comercio y obtener API key inicial.',
    description: 'La API key se devuelve UNA SOLA VEZ. Guardala en un lugar seguro.',
  })
  @ApiCreatedResponse({ description: 'Comercio creado con API key inicial en modo TEST.' })
  @ApiConflictResponse({ description: 'Ya existe un comercio con ese RUC o email.' })
  async create(@Body() dto: CreateMerchantDto) {
    return this.merchants.create(dto);
  }

  @Get('me')
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Datos del comercio autenticado.' })
  @ApiOkResponse()
  @UseGuards(ApiKeyGuard)
  async me(@MerchantId() merchantId: string) {
    const merchant = await this.merchants.findById(merchantId);
    if (!merchant) throw new NotFoundException();
    return merchant;
  }

  @Get('me/api-keys')
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Listar API keys del comercio (sin el secret, solo metadatos).' })
  @UseGuards(ApiKeyGuard)
  async listKeys(@MerchantId() merchantId: string) {
    return this.merchants.listApiKeys(merchantId);
  }
}
