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

  @Get('diagnostic')
  getDiagnostic() {
    return {
      google_service_account_configured: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      google_delegated_admin: process.env.GOOGLE_DELEGATED_ADMIN ? 'Configured' : 'Missing',
      google_customer_id: process.env.GOOGLE_CUSTOMER_ID || 'my_customer (default)',
      sdk_ready: this.syncService.getStatus().then(s => s.googleApiConfigured),
    };
  }
}
