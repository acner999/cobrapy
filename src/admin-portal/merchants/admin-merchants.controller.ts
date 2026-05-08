import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { AdminMerchantsService } from './admin-merchants.service';
import { KycStatus } from '@prisma/client';

@ApiTags('admin-portal')
@ApiBearerAuth('admin-jwt')
@Controller('admin-portal/merchants')
@UseGuards(AdminGuard)
export class AdminMerchantsController {
  constructor(private readonly merchants: AdminMerchantsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los comercios.' })
  list(
    @Query('search') search?: string,
    @Query('kycStatus') kycStatus?: KycStatus,
    @Query('limit') limit?: string,
  ) {
    return this.merchants.list({ search, kycStatus, limit: limit ? parseInt(limit, 10) : undefined });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un comercio.' })
  findOne(@Param('id') id: string) {
    return this.merchants.findById(id);
  }

  @Post(':id/kyc/approve')
  @ApiOperation({ summary: 'Aprobar el KYC de un comercio.' })
  approve(@Param('id') id: string) {
    return this.merchants.approveKyc(id);
  }

  @Post(':id/kyc/reject')
  @ApiOperation({ summary: 'Rechazar el KYC de un comercio.' })
  reject(@Param('id') id: string) {
    return this.merchants.rejectKyc(id);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspender un comercio.' })
  suspend(@Param('id') id: string, @Body() body: { active: boolean }) {
    return this.merchants.setActive(id, body.active);
  }
}
