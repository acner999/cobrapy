import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty() @IsString() planId!: string;
  @ApiProperty() @IsEmail() customerEmail!: string;
  @ApiProperty() @IsString() customerName!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() customerPhone?: string;
  @ApiProperty({ required: false, description: 'ID propio del comercio para idempotencia' })
  @IsOptional() @IsString() externalId?: string;
}
