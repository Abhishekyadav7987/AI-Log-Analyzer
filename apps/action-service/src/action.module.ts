import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';
import { KafkaModule } from '@app/kafka';
import { ActionController } from './action.controller';
import { ActionService } from './action.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    KafkaModule,
  ],
  controllers: [ActionController],
  providers: [ActionService],
})
export class ActionModule {}
