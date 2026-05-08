import { Body, Controller, ForbiddenException, Headers, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiOkResponse, ApiForbiddenResponse, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ChargesService } from '../charges/charges.service';
import { randomBytes } from 'crypto';

class SimulatePaidDto {
  @ApiProperty({ required: false, example: 'Juan Pérez' })
  @IsOptional() @IsString() payerName?: string;

  @ApiProperty({ required: false, example: '1234567' })
  @IsOptional() @IsString() payerDocument?: string;

  @ApiProperty({ required: false, example: '001' })
  @IsOptional() @IsString() payerBankCode?: string;
}

@ApiTags('admin')
@ApiSecurity('admin-token')
@Controller('admin')
export class AdminController {
  constructor(private readonly charges: ChargesService) {}

  @Post('charges/:id/simulate-paid')
  @ApiOperation({
    summary: 'DEV ONLY — simular un pago confirmado por el SIP.',
    description: 'Requiere header `X-Admin-Token`. Marca el cobro como PAID, escribe el ledger y dispara el webhook `charge.paid`.',
  })
  @ApiOkResponse({ description: 'Cobro marcado como PAID y webhook disparado.' })
  @ApiForbiddenResponse({ description: 'Token de admin inválido.' })
  async simulatePaid(
    @Param('id') chargeId: string,
    @Headers('x-admin-token') token: string | undefined,
    @Body() dto: SimulatePaidDto,
  ) {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected || token !== expected) {
      throw new ForbiddenException('Invalid admin token');
    }
    return this.charges.markPaid(chargeId, {
      sipTransactionId: `sip_mock_${randomBytes(8).toString('hex')}`,
      payerName: dto.payerName ?? 'Juan Pérez',
      payerDocument: dto.payerDocument ?? '1234567',
      payerBankCode: dto.payerBankCode ?? '001',
    });
  }
}
