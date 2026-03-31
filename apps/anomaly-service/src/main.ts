import { NestFactory } from '@nestjs/core';
import { AnomalyModule } from './anomaly.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AnomalyModule);
  await app.init(); // Service only (no HTTP)
  Logger.log('Anomaly Detection Service is running...', 'Bootstrap');
}
bootstrap();
