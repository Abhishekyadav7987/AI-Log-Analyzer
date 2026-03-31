import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { KafkaService } from '@app/kafka';
import { KAFKA_TOPICS } from '@app/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer() server: Server | undefined;
  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly kafka: KafkaService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  async onModuleInit() {
    // Subscribe to all relevant Kafka topics and broadcast to WS
    const topics = [
      KAFKA_TOPICS.LOGS, 
      KAFKA_TOPICS.ANOMALIES, 
      KAFKA_TOPICS.TICKETS, 
      KAFKA_TOPICS.RESOLUTIONS,
      KAFKA_TOPICS.FIX_EXECUTIONS
    ];
    
    await this.kafka.subscribe('ws-gateway-group', topics, async ({ topic, message }) => {
      if (!message.value) return;
      const payload = JSON.parse(message.value.toString());
      this.logger.log(`Broadcasting ${topic} event to clients: ${payload.ticketId || payload.id || 'N/A'}`);
      if (this.server) {
        this.server.emit(topic, payload);
      } else {
        this.logger.warn(`Cannot broadcast ${topic} event: WebSocket server is not initialized`);
      }
    });
  }
}
