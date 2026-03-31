import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@app/kafka';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaModule,
  ],
  providers: [EventsGateway],
})
export class WebSocketModule {}
