import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Credit Management Platform')
    .setDescription(
      'Enterprise-grade credit management API with RBAC and transaction tracking',
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

  console.log(`🚀  API running at  http://localhost:${port}/api`);
  console.log(`📚  Swagger docs    http://localhost:${port}/api/docs`);
}

bootstrap();
