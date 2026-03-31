import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Consumer[] = [];
  private readonly logger = new Logger(KafkaService.name);

  constructor(private configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS') || this.configService.get<string>('KAFKA_BROKER') || 'localhost:9092';
    this.kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID', 'log-analyzer'),
      brokers: brokers.split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka Producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
    this.logger.log('Kafka connections closed');
  }

  async emit(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async subscribe(groupId: string, topics: string[], onMessage: (payload: EachMessagePayload) => Promise<void>, config?: any) {
    const consumer = this.kafka.consumer({ groupId, ...config });
    await consumer.connect();
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: config?.fromBeginning ?? false });
    }

    await consumer.run({
      eachMessage: async (payload) => {
        try {
          await onMessage(payload);
        } catch (error: any) {
          this.logger.error(`Error processing message from topic ${payload.topic}: ${error.message}`);
          // Potential DLQ logic here
        }
      },
    });

    this.consumers.push(consumer);
    this.logger.log(`Subscribed to topics: ${topics.join(', ')} with group: ${groupId}`);
  }
}
