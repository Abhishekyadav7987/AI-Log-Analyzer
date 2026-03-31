import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '@app/kafka';
import { PrismaService } from '@app/database';
import { KAFKA_TOPICS, TicketPayload } from '@app/common';
import { ollama } from 'ai-sdk-ollama';
import { generateText } from 'ai';

@Injectable()
export class AIService implements OnModuleInit {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly kafka: KafkaService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.kafka.subscribe('ai-group', [KAFKA_TOPICS.TICKETS], async ({ message }) => {
      if (!message.value) return;
      const ticket: TicketPayload = JSON.parse(message.value.toString());
      await this.analyzeTicket(ticket);
    }, { sessionTimeout: 300000, heartbeatInterval: 60000, fromBeginning: true });
  }

  private async analyzeTicket(ticket: TicketPayload) {
    this.logger.log(`Analyzing ticket ${ticket.id} with Ollama...`);

    try {
      const prompt = `
        As a Staff SRE, analyze this system anomaly and provide a structured resolution.
        Service: ${ticket.title}
        Type: ${ticket.anomalyType}
        Details: ${JSON.stringify(ticket.details)}

        Return ONLY a JSON object with:
        {
          "cause": "Short explanation of the root cause",
          "fix": "Recommended fix",
          "commands": ["list", "of", "shell", "commands", "to", "fix"],
          "confidence": 0.0 to 1.0
        }
      `;

      const { text } = await generateText({
        model: ollama('qwen2.5:7b-instruct'),
        prompt,
      });

      const resolutionData = this.parseAIResponse(text);

      const resolution = await this.prisma.resolution.upsert({
        where: { ticketId: ticket.id },
        update: {
          cause: resolutionData.cause,
          fix: resolutionData.fix,
          commands: resolutionData.commands,
          confidence: resolutionData.confidence,
        },
        create: {
          ticketId: ticket.id,
          cause: resolutionData.cause,
          fix: resolutionData.fix,
          commands: resolutionData.commands,
          confidence: resolutionData.confidence,
          model: 'qwen2.5:7b-instruct',
        },
      });

      // Broadast resolution to Kafka
      await this.kafka.emit(KAFKA_TOPICS.RESOLUTIONS, {
        ticketId: ticket.id,
        cause: resolutionData.cause,
        fix: resolutionData.fix,
        commands: resolutionData.commands,
        confidence: resolutionData.confidence,
      });

      this.logger.log(`Resolution generated for ticket ${ticket.id}`);
    } catch (error: any) {
      this.logger.error(`AI analysis failed for ticket ${ticket.id}: ${error.message}`);
    }
  }

  private parseAIResponse(text: string) {
    try {
      // Find the first { and last } to extract JSON
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}') + 1;
      let jsonStr = text.substring(start, end);
      
      // Strip single-line comments that AI sometimes adds
      jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
      
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${text}`);
      return {
        cause: 'Unknown',
        fix: 'Manual intervention required',
        commands: [],
        confidence: 0,
      };
    }
  }
}
