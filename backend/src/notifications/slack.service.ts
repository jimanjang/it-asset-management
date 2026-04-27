import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ExceptionRequest, ExceptionStatus } from '../database/entities';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly botToken: string;
  private readonly channelId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.botToken = this.configService.get<string>('SLACK_BOT_TOKEN');
    this.channelId = this.configService.get<string>('SLACK_CHANNEL_ID') || 'C0123456789';
  }

  async sendApprovalNotification(request: ExceptionRequest) {
    if (!this.botToken) {
      this.logger.warn('SLACK_BOT_TOKEN not configured, skipping notification');
      return;
    }

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🚨 새로운 다운로드 예외 승인 요청이 도착했습니다.*`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*신청자:*\n${request.requesterEmail}` },
          { type: 'mrkdwn', text: `*파일명:*\n${request.filename || 'N/A'}` },
          { type: 'mrkdwn', text: `*요청 사유:*\n${request.reason}` },
          { type: 'mrkdwn', text: `*대상 URL:*\n${request.url}` },
        ],
      },
      {
        type: 'actions',
        block_id: `approval_actions_${request.id}`,
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Approve (60m)', emoji: true },
            style: 'primary',
            value: request.id,
            action_id: 'approve_request',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Reject', emoji: true },
            style: 'danger',
            value: request.id,
            action_id: 'reject_request',
          },
        ],
      },
    ];

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          'https://slack.com/api/chat.postMessage',
          {
            channel: this.channelId,
            blocks,
            text: `신규 예외 승인 요청: ${request.requesterEmail}`,
          },
          {
            headers: { Authorization: `Bearer ${this.botToken}` },
          },
        ),
      );

      if (!response.data.ok) {
        this.logger.error(`Slack API error: ${response.data.error}`);
      } else {
        this.logger.log(`Slack notification sent for request ${request.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send Slack notification: ${error.message}`);
    }
  }

  async updateNotificationAfterAction(request: ExceptionRequest, adminName: string) {
    if (!this.botToken) return;

    this.logger.log(`Slack message update triggered for ${request.id} by ${adminName}. Status: ${request.status}`);
    
    // In a production environment, we would use chat.update with the message timestamp.
    // For now, we're providing the logic layout.
    const statusText = request.status === ExceptionStatus.APPROVED 
      ? `✅ *승인됨* (처리자: ${adminName})` 
      : `❌ *반려됨* (처리자: ${adminName})`;

    this.logger.debug(`Proposed Slack Update: ${statusText}`);
  }
}
