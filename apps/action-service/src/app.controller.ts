import { Controller, Param, Post } from '@nestjs/common';

@Controller()
export class AppController {
  @Post('auto-fix/:ticketId')
  autoFix(@Param('ticketId') ticketId: string): { ticketId: string; status: string } {
    return { ticketId, status: 'queued' };
  }
}
