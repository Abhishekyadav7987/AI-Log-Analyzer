import { NestFactory } from '@nestjs/core';
import { WebSocketModule } from './websocket.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(WebSocketModule);
  app.enableCors();
  const port = process.env.PORT || 3006;
  await app.listen(port);
  Logger.log(`WebSocket Gateway is running on port: ${port}`, 'Bootstrap');
}
bootstrap();
