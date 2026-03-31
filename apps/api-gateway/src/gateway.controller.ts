import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { AuthGuard } from '@app/auth';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards as UseNestGuards } from '@nestjs/common';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get()
  getHello(): string {
    return this.gatewayService.getHello();
  }

  @Get('health')
  checkHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
