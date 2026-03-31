import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '@app/kafka';
import { KAFKA_TOPICS, LogLevel, LogPayload } from '@app/common';

@Injectable()
export class AnomalyService implements OnModuleInit {
  private readonly logger = new Logger(AnomalyService.name);
  private readonly ERROR_THRESHOLD = 5; // Example: 5 errors in a short period
  private errorWindow: Map<string, LogPayload[]> = new Map();

  constructor(private readonly kafka: KafkaService) {}

  async onModuleInit() {
    await this.kafka.subscribe('anomaly-group', [KAFKA_TOPICS.LOGS], async ({ message }) => {
      if (!message.value) return;
      const log: LogPayload = JSON.parse(message.value.toString());
      await this.processLog(log);
    });
  }

  private async processLog(log: LogPayload) {
    // 1. Rule-based detection: Level is ERROR or CRITICAL
    if (log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL) {
      this.logger.warn(`Anomaly detected: ${log.level} in ${log.serviceName}`);
      await this.publishAnomaly({
        level: log.level,
        serviceName: log.serviceName,
        message: log.message,
        anomalyType: 'CRITICAL_LEVEL',
        logs: [log],
      });
    }

    // 2. Trend-based detection: High frequency of errors
    // Simple windowing logic (can be replaced with Redis/Sliding Window)
    if (log.level === LogLevel.WARN || log.level === LogLevel.ERROR) {
      const key = `${log.serviceName}:${log.level}`;
      const recentLogs = this.errorWindow.get(key) || [];
      recentLogs.push(log);
      
      // Keep only logs from the last 1 minute (for example)
      const now = new Date().getTime();
      const filteredLogs = recentLogs.filter(l => now - new Date(l.timestamp).getTime() < 60000);
      this.errorWindow.set(key, filteredLogs);

      if (filteredLogs.length >= this.ERROR_THRESHOLD) {
        this.logger.error(`Frequency spike detected for ${key}: ${filteredLogs.length} logs in 1m`);
        await this.publishAnomaly({
          level: log.level,
          serviceName: log.serviceName,
          message: `High frequency of ${log.level} logs`,
          anomalyType: 'FREQUENCY_SPIKE',
          count: filteredLogs.length,
          logs: filteredLogs,
        });
        // Clear window after detection to avoid duplicate alerts in same minute
        this.errorWindow.set(key, []);
      }
    }
  }

  private async publishAnomaly(anomaly: any) {
    await this.kafka.emit(KAFKA_TOPICS.ANOMALIES, anomaly);
  }
}
