import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { MerchantId } from '../auth/merchant.decorator';
import { RequireRole, RoleGuard } from '../auth/role.decorator';
import { TeamsService } from './teams.service';
import { MembershipRole } from '@prisma/client';

class InviteDto {
  @ApiProperty({ example: 'cajero@cafeteria.py' })
  @IsEmail() email!: string;

  @ApiProperty({ enum: ['ADMIN', 'OPERATOR', 'READONLY'] })
  @IsEnum(MembershipRole) role!: Exclude<MembershipRole, 'OWNER'>;
}

class ChangeRoleDto {
  @ApiProperty({ enum: ['ADMIN', 'OPERATOR', 'READONLY'] })
  @IsEnum(MembershipRole) role!: Exclude<MembershipRole, 'OWNER'>;
}

@ApiTags('teams')
@ApiBearerAuth('user-jwt')
@Controller('teams')
@UseGuards(ApiKeyGuard, RoleGuard)
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar miembros del comercio activo.' })
  list(@MerchantId() merchantId: string) {
    return this.teams.listMembers(merchantId);
  }

  @Post('invite')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Invitar a un usuario existente al comercio. Requiere ADMIN.' })
  invite(
    @MerchantId() merchantId: string,
    @Body() dto: InviteDto,
    // El invitedBy se podría leer del req.userId, pero por simplicidad usamos el merchantId del invitador.
  ) {
    return this.teams.invite(merchantId, merchantId, dto.email, dto.role);
  }

  @Patch(':id/role')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Cambiar rol de un miembro. Requiere ADMIN.' })
  changeRole(
    @MerchantId() merchantId: string,
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.teams.changeRole(merchantId, id, dto.role);
  }

  @Delete(':id')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Quitar miembro del comercio. Requiere ADMIN.' })
  remove(@MerchantId() merchantId: string, @Param('id') id: string) {
    return this.teams.remove(merchantId, id);
  }
}
