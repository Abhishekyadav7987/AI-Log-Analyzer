import { NestFactory } from '@nestjs/core';
import { AIModule } from './ai.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AIModule);
  await app.init();
  Logger.log('AI Service (Ollama) is running...', 'Bootstrap');
}
bootstrap();
