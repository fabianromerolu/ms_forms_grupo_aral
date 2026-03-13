import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ms_forms_grupo_aral')
    .setDescription('Microservicio de almacenamiento de reportes/forms')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Esto maneja SIGTERM/SIGINT (Railway) y dispara OnModuleDestroy
  app.enableShutdownHooks();

  const port = process.env.PORT ? Number(process.env.PORT) : 3005;
  await app.listen(port);
}
bootstrap();
