import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  getHello(): string {
    return 'AI Log Analyzer API Gateway v1.0';
  }
}
