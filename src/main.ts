import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { validateEnv } from './common/env.validation';

async function bootstrap() {
  validateEnv(process.env);

  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  app.use(helmet());
  app.setGlobalPrefix('v1', { exclude: ['/'] });
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CobraPy API')
    .setDescription('Cobros instantáneos sobre el SIP del BCP (Paraguay).')
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'API Key', description: 'Pegá tu API key (ck_test_... o ck_live_...)' },
      'api-key',
    )
    .addApiKey({ type: 'apiKey', name: 'X-Admin-Token', in: 'header' }, 'admin-token')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT del staff de CobraPy (POST /admin-portal/auth/login)' },
      'admin-jwt',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT de usuario del dashboard (POST /auth/login)' },
      'user-jwt',
    )
    .addTag('health', 'Health checks')
    .addTag('merchants', 'Onboarding y gestión de comercios')
    .addTag('charges', 'Cobros y QR EMVCo')
    .addTag('webhooks', 'Endpoints de notificación')
    .addTag('admin', 'Endpoints internos para desarrollo')
    .addTag('admin-portal', 'Portal del equipo CobraPy (KYC, métricas, comercios)')
    .addTag('auth', 'Registro y login de usuarios del dashboard')
    .addTag('teams', 'Gestión de miembros del comercio')
    .addTag('whatsapp', 'Bot de WhatsApp para cobros vía mensaje')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`CobraPy API running on http://localhost:${port}/v1`, 'Bootstrap');
  Logger.log(`Swagger UI: http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error(`Bootstrap failed: ${err.message}`, err.stack, 'Bootstrap');
  process.exit(1);
});
