import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  if (!(BigInt.prototype as any).toJSON) {
    (BigInt.prototype as any).toJSON = function () {
      return Number(this);
    };
  }

  const config = new DocumentBuilder()
    .setTitle('Order IT Youth – Admin API')
    .setDescription(
      'Admin API for managing catalog, combos, orders and payments for the Order IT Youth charity store.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'admin-jwt',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
