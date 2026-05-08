import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from './api-key.guard';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';
import { RoleGuard } from './role.decorator';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [UserAuthController],
  providers: [ApiKeyService, ApiKeyGuard, UserAuthService, RoleGuard],
  exports: [ApiKeyService, ApiKeyGuard, UserAuthService, RoleGuard],
})
export class AuthModule {}
