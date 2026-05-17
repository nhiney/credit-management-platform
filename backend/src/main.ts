import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { winstonLoggerOptions } from './infrastructure/logger/winston.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonLoggerOptions),
    bufferLogs: true,
  });

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS (lock down in production) ────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? '*',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  });

  app.setGlobalPrefix('api');

  // ── Request validation ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global error handler ──────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Request/response logging with correlation IDs ─────────────────────────
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── Swagger ───────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Credit Management Platform')
    .setDescription(
      'Enterprise-grade credit management API with RBAC, ACID transactions, and structured logging.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('auth', 'Authentication — register & login')
    .addTag('users', 'User profile & credit balance')
    .addTag('packages', 'Package CRUD (Admin)')
    .addTag('purchase', 'Purchase a package')
    .addTag('transactions', 'Credit transaction history')
    .addTag('ai', 'AI feature endpoints (credit-gated)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`🚀  API running at  http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`📚  Swagger docs    http://localhost:${port}/api/docs`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
