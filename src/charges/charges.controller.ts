import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiQuery, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ChargesService } from './charges.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { MerchantId } from '../auth/merchant.decorator';
import { ChargeStatus } from '@prisma/client';

@ApiTags('charges')
@ApiBearerAuth('api-key')
@ApiUnauthorizedResponse({ description: 'API key faltante o inválida.' })
@Controller('charges')
@UseGuards(ApiKeyGuard)
export class ChargesController {
  constructor(private readonly charges: ChargesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un cobro y generar su QR EMVCo.',
    description: 'El QR generado es interoperable con el QR Hub del SIP. Soporta idempotencia vía `externalId`.',
  })
  @ApiCreatedResponse({ description: 'Cobro creado, listo para ser pagado.' })
  create(@MerchantId() merchantId: string, @Body() dto: CreateChargeDto) {
    return this.charges.create(merchantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cobros del comercio.' })
  @ApiQuery({ name: 'status', required: false, enum: ChargeStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Máx. 200. Default 50.' })
  list(
    @MerchantId() merchantId: string,
    @Query('status') status?: ChargeStatus,
    @Query('limit') limit?: string,
  ) {
    return this.charges.list(merchantId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un cobro.' })
  @ApiOkResponse({ description: 'Cobro encontrado.' })
  @ApiNotFoundResponse({ description: 'No existe o no pertenece al comercio.' })
  async findOne(@MerchantId() merchantId: string, @Param('id') id: string) {
    const charge = await this.charges.findOne(merchantId, id);
    if (!charge) throw new NotFoundException(`Charge ${id} not found`);
    return charge;
  }
}

// Endpoint público (sin auth) para la página de pago del cliente final
@ApiTags('charges')
@Controller('pay')
export class PublicChargeController {
  constructor(private readonly charges: ChargesService) {}

  @Get(':id')
  @ApiExcludeEndpoint()
  async getPublic(@Param('id') id: string) {
    const charge = await this.charges.findPublic(id);
    if (!charge) throw new NotFoundException('Cobro no encontrado o expirado');
    return charge;
  }
}
