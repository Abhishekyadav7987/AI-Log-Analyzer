import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { KafkaService } from '@app/kafka';
import { KAFKA_TOPICS, AnomalyPayload } from '@app/common';

@Injectable()
export class TicketService implements OnModuleInit {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
  ) {}

  async onModuleInit() {
    await this.kafka.subscribe('ticket-group', [KAFKA_TOPICS.ANOMALIES], async ({ message }) => {
      if (!message.value) return;
      const anomaly: AnomalyPayload = JSON.parse(message.value.toString());
      await this.createTicket(anomaly);
    });
  }

  private async createTicket(anomaly: AnomalyPayload) {
    this.logger.log(`Creating ticket for anomaly in ${anomaly.serviceName}`);

    // Create ticket in DB
    const ticket = await this.prisma.ticket.create({
      data: {
        title: `Anomaly in ${anomaly.serviceName}: ${anomaly.anomalyType}`,
        severity: anomaly.level,
        anomalyType: anomaly.anomalyType,
        status: 'OPEN',
        details: anomaly as any,
      },
    });

    // Publish ticket created event
    await this.kafka.emit(KAFKA_TOPICS.TICKETS, {
      id: ticket.id,
      title: ticket.title,
      severity: ticket.severity,
      anomalyType: ticket.anomalyType,
      details: ticket.details,
    });

    this.logger.log(`Ticket created: ${ticket.id}`);
  }
}
