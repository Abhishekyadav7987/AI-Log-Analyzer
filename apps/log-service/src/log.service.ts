import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { KafkaService } from '@app/kafka';
import { KAFKA_TOPICS } from '@app/common';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
  ) {}

  async create(createLogDto: CreateLogDto) {
    // 1. Persist to DB
    const log = await this.prisma.log.create({
      data: {
        ...createLogDto,
        metadata: createLogDto.metadata || {},
      },
    });

    // 2. Publish to Kafka
    await this.kafka.emit(KAFKA_TOPICS.LOGS, {
      ...log,
      timestamp: log.ingestedAt.toISOString(),
    });

    this.logger.log(`Log ingested and published: ${log.id} from ${log.serviceName}`);
    return log;
  }
}
