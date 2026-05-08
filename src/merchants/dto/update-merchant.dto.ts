import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateMerchantDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}