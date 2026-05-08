import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiExcludeEndpoint } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { MerchantId } from '../auth/merchant.decorator';
import { WhatsAppService } from './whatsapp.service';

class LinkAccountDto {
  @ApiProperty({ example: '+595981000000' })
  @IsString() @Matches(/^\+\d{10,15}$/, { message: 'Formato E.164 (+país número)' })
  phone!: string;
}

class SimulateDto {
  @ApiProperty({ example: '+595981000000' })
  @IsString() fromPhone!: string;

  @ApiProperty({ example: 'cobro 50000 a Juan' })
  @IsString() body!: string;
}

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly wa: WhatsAppService) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook entrante de Twilio (form-urlencoded).' })
  @ApiExcludeEndpoint()
  async webhook(@Body() body: Record<string, string>) {
    // Twilio envía: From=whatsapp:+595..., Body=...
    const from = body.From ?? body.from;
    const text = body.Body ?? body.body;
    if (!from || !text) return { ok: false };
    return this.wa.handleInbound(from, text);
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Simulador local — corre el flujo del bot sin Twilio.' })
  simulate(@Body() dto: SimulateDto) {
    return this.wa.handleInbound(dto.fromPhone, dto.body);
  }

  @Get('accounts')
  @ApiBearerAuth('user-jwt')
  @ApiOperation({ summary: 'Listar números de WhatsApp vinculados al comercio.' })
  @UseGuards(ApiKeyGuard)
  list(@MerchantId() merchantId: string) {
    return this.wa.listAccounts(merchantId);
  }

  @Post('accounts')
  @ApiBearerAuth('user-jwt')
  @ApiOperation({ summary: 'Vincular un número de WhatsApp al comercio activo.' })
  @UseGuards(ApiKeyGuard)
  link(@MerchantId() merchantId: string, @Body() dto: LinkAccountDto) {
    return this.wa.linkAccount(merchantId, dto.phone);
  }

  @Delete('accounts/:id')
  @ApiBearerAuth('user-jwt')
  @ApiOperation({ summary: 'Desvincular número de WhatsApp.' })
  @UseGuards(ApiKeyGuard)
  unlink(@MerchantId() merchantId: string, @Param('id') id: string) {
    return this.wa.unlinkAccount(merchantId, id);
  }
}
