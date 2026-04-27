import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ExceptionsService } from './exceptions.service';
import { ExceptionRequest } from '../database/entities';

@Controller('v1/exceptions')
export class ExceptionsController {
  constructor(private readonly exceptionsService: ExceptionsService) {}

  @Post()
  async createRequest(
    @Body() dto: { url: string; reason: string; requesterEmail: string; filename?: string },
    @Req() req: any,
  ): Promise<ExceptionRequest> {
    // Use explicitly requested email if provided, otherwise fallback to session
    const requesterEmail = dto.requesterEmail || req.user?.email || 'test-user@daangnservice.com';
    return this.exceptionsService.createRequest({
      ...dto,
      requesterEmail,
    });
  }

  @Get('history')
  async getHistory(@Query('limit') limit: number): Promise<ExceptionRequest[]> {
    return this.exceptionsService.getHistory(limit);
  }

  @Patch(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() dto: { durationMinutes?: number },
    @Req() req: any,
  ): Promise<ExceptionRequest> {
    const adminEmail = req.user?.email || 'admin@daangnservice.com';
    return this.exceptionsService.approve(id, adminEmail, dto.durationMinutes);
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: { comment?: string },
    @Req() req: any,
  ): Promise<ExceptionRequest> {
    const adminEmail = req.user?.email || 'admin@daangnservice.com';
    return this.exceptionsService.reject(id, adminEmail, dto.comment);
  }

  /**
   * Slack Interactive Endpoint
   * This handles buttons from the Slack message
   */
  @Post('slack/interactive')
  async handleSlackInteractive(@Body() body: any): Promise<any> {
    const payload = JSON.parse(body.payload);
    const action = payload.actions[0];
    const requestId = action.value;
    const adminEmail = payload.user.username + '@daangnservice.com'; // Simple mapping for demo

    if (action.action_id === 'approve_request') {
      await this.exceptionsService.approve(requestId, adminEmail);
    } else if (action.action_id === 'reject_request') {
      await this.exceptionsService.reject(requestId, adminEmail, 'Rejected via Slack');
    }

    return {
      replace_original: true,
      text: `처리 완료: ${action.action_id === 'approve_request' ? '승인됨' : '반려됨'} (By ${adminEmail})`,
    };
  }
}
