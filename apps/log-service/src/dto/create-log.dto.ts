import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { LogLevel } from '@app/common';

export class CreateLogDto {
  @IsString()
  source!: string;

  @IsString()
  serviceName!: string;

  @IsString()
  @IsOptional()
  host?: string;

  @IsEnum(LogLevel)
  level!: LogLevel;

  @IsString()
  message!: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
