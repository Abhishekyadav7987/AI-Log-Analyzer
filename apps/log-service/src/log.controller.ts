import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async ingest(@Body() createLogDto: CreateLogDto) {
    return this.logService.create(createLogDto);
  }
}
