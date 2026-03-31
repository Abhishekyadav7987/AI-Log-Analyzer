export const KAFKA_TOPICS = {
  LOGS: 'logs',
  ANOMALIES: 'anomalies',
  TICKETS: 'tickets',
  RESOLUTIONS: 'resolutions',
  FIX_EXECUTIONS: 'fix-executions',
};

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogPayload {
  source: string;
  serviceName: string;
  level: LogLevel;
  message: string;
  metadata?: any;
  timestamp: string;
}

export interface AnomalyPayload {
  level: LogLevel;
  serviceName: string;
  message: string;
  anomalyType: string;
  count?: number;
  logs: LogPayload[];
}

export interface TicketPayload {
  id: string;
  title: string;
  severity: string;
  anomalyType: string;
  details: any;
}
