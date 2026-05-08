import { IsEmail, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMerchantDto {
  @ApiProperty({ description: 'Nombre del comercio (visible en el QR).', example: 'Cafetería El Tereré' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName!: string;

  @ApiProperty({ description: 'RUC en formato XXXXXXXX-X.', example: '80012345-6' })
  @IsString()
  @Matches(/^\d{1,8}-\d$/, { message: 'RUC debe tener formato XXXXXXXX-X' })
  ruc!: string;

  @ApiProperty({ example: 'comercio@example.py' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+595981000000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
