import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@app/kafka';
import { AnomalyService } from './anomaly.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaModule,
  ],
  providers: [AnomalyService],
})
export class AnomalyModule {}
