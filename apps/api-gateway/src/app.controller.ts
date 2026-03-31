import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('logs')
  ingest(@Body() body: Record<string, unknown>): Promise<{ id: string }> {
    return this.appService.ingest(body);
  }

  @Get('tickets')
  tickets(): Promise<unknown[]> {
    return this.appService.tickets();
  }
}
