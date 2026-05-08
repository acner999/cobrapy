import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { AdminStatsService } from './admin-stats.service';

@ApiTags('admin-portal')
@ApiBearerAuth('admin-jwt')
@Controller('admin-portal')
@UseGuards(AdminGuard)
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Métricas generales de la plataforma (últimos 30 días).' })
  overview() {
    return this.stats.overview();
  }

  @Get('charges')
  @ApiOperation({ summary: 'Listar todos los cobros del sistema (admin).' })
  charges(@Query('limit') limit?: string) {
    return this.stats.recentCharges(limit ? parseInt(limit, 10) : 50);
  }
}
