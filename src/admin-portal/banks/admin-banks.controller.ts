import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, Allow } from 'class-validator';
import { AdminBanksService } from './admin-banks.service';

class CreateBankDto {
  @Allow() @IsString() code!: string;
  @Allow() @IsString() name!: string;
}

class UpdateBankDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

@ApiTags('admin-banks')
@ApiSecurity('admin-token')
@Controller('admin-portal/banks')
export class AdminBanksController {
  constructor(private readonly banks: AdminBanksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los bancos' })
  findAll() {
    return this.banks.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Obtener un banco por código' })
  findOne(@Param('code') code: string) {
    return this.banks.findOne(code);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo banco' })
  create(@Body() dto: CreateBankDto) {
    return this.banks.create(dto);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Actualizar un banco' })
  update(@Param('code') code: string, @Body() dto: UpdateBankDto) {
    return this.banks.update(code, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Eliminar un banco' })
  delete(@Param('code') code: string) {
    return this.banks.delete(code);
  }
}