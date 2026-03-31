import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async ingest(_body: Record<string, unknown>): Promise<{ id: string }> {
    return { id: 'placeholder' };
  }

  async tickets(): Promise<unknown[]> {
    return [];
  }
}
