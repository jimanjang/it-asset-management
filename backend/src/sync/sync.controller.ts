import { Controller, Post, Get, Query } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('devices')
  triggerSync(@Query('type') type?: 'full' | 'delta') {
    return this.syncService.triggerSync(type || 'full');
  }

  @Get('status')
  getStatus() {
    return this.syncService.getStatus();
  }

  @Get('logs')
  getLogs(@Query('limit') limit?: number) {
    return this.syncService.getLogs(limit ? Number(limit) : 20);
  }
}
