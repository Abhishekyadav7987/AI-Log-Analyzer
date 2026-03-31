import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { KafkaModule } from '@app/kafka';
import { LogController } from './log.controller';
import { LogService } from './log.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    KafkaModule,
  ],
  controllers: [LogController],
  providers: [LogService],
})
export class LogModule {}
