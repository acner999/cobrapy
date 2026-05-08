import { Body, Controller, Get, NotFoundException, Post, Patch, Delete, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiConflictResponse } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { MerchantId } from '../auth/merchant.decorator';

@ApiTags('merchants')
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchants: MerchantsService) {}

  @Get('banks')
  @ApiOperation({ summary: 'Listar bancos disponibles (público).' })
  @ApiOkResponse()
  async listBanks() {
    return this.merchants.listBanks();
  }

  // POST /merchants eliminado: ahora se crean comercios solo via POST /auth/register
  // (que crea User + Merchant + Membership(OWNER) en una transacción).

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

  @Patch('me')
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Actualizar datos del comercio.' })
  @ApiOkResponse()
  @UseGuards(ApiKeyGuard)
  async update(@MerchantId() merchantId: string, @Body() dto: UpdateMerchantDto) {
    return this.merchants.update(merchantId, dto);
  }

  @Get('me/bank-accounts')
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Listar cuentas bancarias del comercio.' })
  @UseGuards(ApiKeyGuard)
  async listBankAccounts(@MerchantId() merchantId: string) {
    return this.merchants.listBankAccounts(merchantId);
  }

  @Post('me/bank-accounts')
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Agregar cuenta bancaria.' })
  @ApiCreatedResponse()
  @UseGuards(ApiKeyGuard)
  async createBankAccount(@MerchantId() merchantId: string, @Body() dto: CreateBankAccountDto) {
    return this.merchants.createBankAccount(merchantId, dto);
  }

  @Delete('me/bank-accounts/:id')
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Eliminar cuenta bancaria.' })
  @UseGuards(ApiKeyGuard)
  async deleteBankAccount(@MerchantId() merchantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.merchants.deleteBankAccount(merchantId, id);
  }

  @Patch('me/bank-accounts/:id')
  @ApiBearerAuth('api-key')
  @ApiOperation({ summary: 'Actualizar cuenta bancaria.' })
  @ApiOkResponse()
  @UseGuards(ApiKeyGuard)
  async updateBankAccount(
    @MerchantId() merchantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.merchants.updateBankAccount(merchantId, id, dto);
  }
}
