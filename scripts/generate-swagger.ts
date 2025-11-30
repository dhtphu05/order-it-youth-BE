/// <reference path="../src/types/express-multer.d.ts" />
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { AppModule } from '../src/app.module';

const docsDir = path.resolve('docs');
const outputPath = path.join(docsDir, 'swagger.json');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
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
      },
      'admin-jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  try {
    await mkdir(docsDir, { recursive: true });
    await writeFile(outputPath, JSON.stringify(document, null, 2));
    console.log(`Swagger spec written to ${outputPath}`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
