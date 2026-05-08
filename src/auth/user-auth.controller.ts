import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiConflictResponse, ApiUnauthorizedResponse, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, Matches, MaxLength } from 'class-validator';
import { Request } from 'express';
import { UserAuthService, UserJwtPayload } from './user-auth.service';
import { ApiKeyGuard } from './api-key.guard';

class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'juan@cafeteria.py' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'cobrapy123', minLength: 8 })
  @IsString() @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Cafetería El Tereré' })
  @IsString() @MinLength(2) @MaxLength(120)
  businessName!: string;

  @ApiProperty({ example: '80012345-1' })
  @IsString() @Matches(/^\d{1,8}-\d$/, { message: 'RUC debe tener formato XXXXXXXX-X' })
  ruc!: string;

  @ApiProperty({ required: false, example: '+595981000000' })
  @IsOptional() @IsString()
  phone?: string;
}

class LoginDto {
  @ApiProperty({ example: 'juan@cafeteria.py' }) @IsEmail() email!: string;
  @ApiProperty({ example: 'cobrapy123' }) @IsString() password!: string;
}

class SwitchDto {
  @ApiProperty({ example: 'cmox...' }) @IsString() merchantId!: string;
}

@ApiTags('auth')
@Controller('auth')
export class UserAuthController {
  constructor(private readonly auth: UserAuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Crear usuario + comercio + membership(OWNER) en una sola operación.',
    description: 'Devuelve un JWT del usuario y la API key inicial del comercio.',
  })
  @ApiCreatedResponse({ description: 'Cuenta creada.' })
  @ApiConflictResponse({ description: 'Email o RUC duplicado.' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login con email + password. Devuelve JWT con merchant activo.' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas.' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  @ApiBearerAuth('user-jwt')
  @ApiOperation({ summary: 'Datos del usuario logueado + memberships disponibles.' })
  @UseGuards(ApiKeyGuard)
  me(@Req() req: Request & { userPayload?: UserJwtPayload }) {
    if (!req.userPayload) throw new Error('Solo accesible con JWT de usuario');
    return this.auth.me(req.userPayload);
  }

  @Post('switch-merchant')
  @ApiBearerAuth('user-jwt')
  @ApiOperation({ summary: 'Cambiar el merchant activo en el JWT.' })
  @UseGuards(ApiKeyGuard)
  switch(@Req() req: Request & { userPayload?: UserJwtPayload }, @Body() dto: SwitchDto) {
    if (!req.userPayload) throw new Error('Solo accesible con JWT de usuario');
    return this.auth.switchMerchant(req.userPayload.sub, dto.merchantId);
  }
}
