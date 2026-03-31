import { NestFactory } from '@nestjs/core';
import { ActionModule } from './action.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ActionModule);
  app.enableCors();
  const port = process.env.PORT || 3005;
  await app.listen(port);
  Logger.log(`Action Service is running on path: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
