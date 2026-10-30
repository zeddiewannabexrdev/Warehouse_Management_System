import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 5000;
  const apiPrefix = configService.get<string>('apiPrefix') || '/api/v1';

  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Distributed WMS & Materials Management API')
    .setDescription('Distributed Materials & Warehouse Management System with MongoDB Sharded Cluster')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Distributed WMS API Docs',
  });

  await app.listen(port);
  logger.log(`Distributed WMS Backend running at: http://localhost:${port}`);
  logger.log(`Swagger OpenAPI Documentation at:   http://localhost:${port}/docs`);
  logger.log(`API Base Endpoint:                 http://localhost:${port}${apiPrefix}`);
}

bootstrap();
