import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePaymentLinkDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  amountGs?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string; // ISO date string

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  maxUses?: number;
}