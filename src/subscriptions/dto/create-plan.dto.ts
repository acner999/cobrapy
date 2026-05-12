import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsPositive, IsEnum, Min } from 'class-validator';
import { BillingInterval } from '@prisma/client';

export class CreatePlanDto {
  @ApiProperty({ example: 'Plan Mensual' })
  @IsString() name!: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ example: 500000, description: 'Monto en guaraníes' })
  @IsInt() @IsPositive() amountGs!: number;

  @ApiProperty({ enum: BillingInterval })
  @IsEnum(BillingInterval) interval!: BillingInterval;

  @ApiProperty({ default: 1, description: 'Cada cuántos intervalos se cobra' })
  @IsOptional() @IsInt() @Min(1) intervalCount?: number;

  @ApiProperty({ required: false, description: 'Días de prueba gratis' })
  @IsOptional() @IsInt() @Min(0) trialDays?: number;
}
