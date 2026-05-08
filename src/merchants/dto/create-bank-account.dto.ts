import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateBankAccountDto {
  @IsNotEmpty()
  @IsString()
  bankCode!: string;

  @IsNotEmpty()
  @IsString()
  accountNumber!: string;

  @IsOptional()
  @IsString()
  accountAlias?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  nameOrBusinessName?: string;
}