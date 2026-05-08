import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';

class AdminLoginDto {
  @ApiProperty({ example: 'admin@cobrapy.test' })
  @IsEmail() email!: string;

  @ApiProperty({ example: 'cobrapy123' })
  @IsString() @MinLength(6) password!: string;
}

@ApiTags('admin-portal')
@Controller('admin-portal/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login del staff de CobraPy. Devuelve un JWT.' })
  @ApiUnauthorizedResponse({ description: 'Email o password incorrectos.' })
  login(@Body() dto: AdminLoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}
