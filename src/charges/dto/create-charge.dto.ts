import { IsInt, IsOptional, IsString, IsEnum, MaxLength, Min, Max, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType } from '@prisma/client';

export class CreateChargeDto {
  @ApiProperty({
    description: 'Monto en guaraníes (sin decimales). Límite SIP: 10.000.000 por operación.',
    minimum: 1,
    maximum: 10_000_000,
    example: 50000,
  })
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  amountGs!: number;

  @ApiPropertyOptional({ description: 'Descripción visible del cobro.', example: 'Almuerzo del lunes' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ enum: PaymentType, description: 'Tipo de cobro. Por defecto QR_DYNAMIC.' })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @ApiPropertyOptional({
    description: 'ID del comercio para idempotencia. Si ya existe un cobro con este externalId, se devuelve el existente.',
    example: 'order-2026-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  externalId?: string;

  @ApiPropertyOptional({ description: 'Metadata libre del comercio.', example: { tableNumber: 5 } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
