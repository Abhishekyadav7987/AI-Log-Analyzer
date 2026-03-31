import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ActionService } from './action.service';
import { AuthGuard } from '@app/auth';

@Controller('auto-fix')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Post(':ticketId')
  async execute(@Param('ticketId') ticketId: string) {
    return this.actionService.executeFix(ticketId);
  }
}
