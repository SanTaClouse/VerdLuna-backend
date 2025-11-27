import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS - Permitir frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix para todas las rutas
  app.setGlobalPrefix('api');

  // Validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades no definidas en DTOs
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
      transform: true, // Transforma payloads a instancias de DTOs
      transformOptions: {
        enableImplicitConversion: true, // Convierte tipos automáticamente
      },
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('BackOffice System Luna API')
    .setDescription(
      'API REST para sistema de gestión de Verdulería La Luna - Maciel, Santa Fe',
    )
    .setVersion('1.0')
    .addTag('Auth', 'Autenticación y autorización')
    .addTag('Clientes', 'Gestión de clientes')
    .addTag('Pedidos', 'Gestión de pedidos')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('');
  console.log('🚀 ===================================');
  console.log(`✅ Servidor corriendo en: http://localhost:${port}/api`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
  console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
  console.log('🚀 ===================================');
  console.log('');
}
bootstrap();
