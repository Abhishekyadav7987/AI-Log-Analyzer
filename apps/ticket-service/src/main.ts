import { NestFactory } from '@nestjs/core';
import { TicketModule } from './ticket.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(TicketModule);
  await app.init();
  Logger.log('Ticket Service is running...', 'Bootstrap');
}
bootstrap();
