import { NestFactory } from '@nestjs/core';
import { LogModule } from './log.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(LogModule);
  app.enableCors();
  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`Log Service is running on path: http://localhost:${port}/logs`, 'Bootstrap');
}
bootstrap();
