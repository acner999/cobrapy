import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UserAuthService } from '../auth/user-auth.service';

@ApiTags('subscriptions')
@ApiBearerAuth('user-jwt')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly service: SubscriptionsService,
    private readonly auth: UserAuthService,
  ) {}

  private async getMerchantId(authorization: string): Promise<string> {
    const token = authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();
    const payload = await this.auth.verify(token);
    if (!payload.mid) throw new UnauthorizedException('No merchant activo');
    return payload.mid;
  }

  // ── STATS ────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'MRR, suscriptores activos, planes activos' })
  async getStats(@Headers('authorization') auth: string) {
    const mid = await this.getMerchantId(auth);
    return this.service.getStats(mid);
  }

  // ── PLANES ───────────────────────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'Listar planes del comercio' })
  async listPlans(@Headers('authorization') auth: string) {
    const mid = await this.getMerchantId(auth);
    return this.service.listPlans(mid);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Crear un plan de suscripción' })
  async createPlan(@Headers('authorization') auth: string, @Body() dto: CreatePlanDto) {
    const mid = await this.getMerchantId(auth);
    return this.service.createPlan(mid, dto);
  }

  @Patch('plans/:id/toggle')
  @ApiOperation({ summary: 'Activar o desactivar un plan' })
  async togglePlan(@Headers('authorization') auth: string, @Param('id') id: string) {
    const mid = await this.getMerchantId(auth);
    return this.service.togglePlan(mid, id);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Eliminar un plan (solo si no tiene suscriptores activos)' })
  async deletePlan(@Headers('authorization') auth: string, @Param('id') id: string) {
    const mid = await this.getMerchantId(auth);
    return this.service.deletePlan(mid, id);
  }

  // ── SUSCRIPTORES ─────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar suscriptores, opcionalmente filtrar por planId' })
  async listSubscriptions(
    @Headers('authorization') auth: string,
    @Query('planId') planId?: string,
  ) {
    const mid = await this.getMerchantId(auth);
    return this.service.listSubscriptions(mid, planId);
  }

  @Post()
  @ApiOperation({ summary: 'Suscribir a un cliente a un plan' })
  async createSubscription(@Headers('authorization') auth: string, @Body() dto: CreateSubscriptionDto) {
    const mid = await this.getMerchantId(auth);
    return this.service.createSubscription(mid, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una suscripción' })
  async cancel(@Headers('authorization') auth: string, @Param('id') id: string) {
    const mid = await this.getMerchantId(auth);
    return this.service.cancelSubscription(mid, id);
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pausar una suscripción' })
  async pause(@Headers('authorization') auth: string, @Param('id') id: string) {
    const mid = await this.getMerchantId(auth);
    return this.service.pauseSubscription(mid, id);
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Reanudar una suscripción pausada' })
  async resume(@Headers('authorization') auth: string, @Param('id') id: string) {
    const mid = await this.getMerchantId(auth);
    return this.service.resumeSubscription(mid, id);
  }
}
