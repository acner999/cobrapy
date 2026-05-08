import { Body, Controller, Post, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiUnauthorizedResponse, ApiBearerAuth } from '@nestjs/swagger';
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

  @Get('me')
  @ApiOperation({ summary: 'Validar token de admin y devolver datos del admin.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  async me(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('No token provided');
    try {
      const payload = await this.auth.verify(token);
      return { valid: true, admin: { id: payload.sub, email: payload.email, role: payload.role } };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
