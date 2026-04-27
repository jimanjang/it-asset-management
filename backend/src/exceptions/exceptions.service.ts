import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ExceptionRequest, ExceptionStatus } from '../database/entities';
import { GoogleAdminService } from '../sync/google-admin.service';
import { SlackService } from '../notifications/slack.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ExceptionsService {
  private readonly logger = new Logger(ExceptionsService.name);
  private readonly EXCEPTION_GROUP_EMAIL = process.env.GOOGLE_EXCEPTION_GROUP_EMAIL || 'chrome-exceptions@daangnservice.com';

  constructor(
    @InjectRepository(ExceptionRequest)
    private readonly exceptionRepository: Repository<ExceptionRequest>,
    private readonly googleAdminService: GoogleAdminService,
    private readonly slackService: SlackService,
  ) {}

  async createRequest(dto: {
    requesterEmail: string;
    url: string;
    reason: string;
    filename?: string;
  }): Promise<ExceptionRequest> {
    const request = this.exceptionRepository.create({
      ...dto,
      status: ExceptionStatus.PENDING,
    });
    const saved = await this.exceptionRepository.save(request);
    
    this.logger.log(`New exception request created: ${saved.id} by ${dto.requesterEmail}`);
    
    // Slack Notification
    await this.slackService.sendApprovalNotification(saved);
    
    return saved;
  }

  async findOne(id: string): Promise<ExceptionRequest> {
    const request = await this.exceptionRepository.findOneBy({ id });
    if (!request) throw new NotFoundException('Exception request not found');
    return request;
  }

  async approve(id: string, adminEmail: string, durationMinutes: number = 60): Promise<ExceptionRequest> {
    const request = await this.findOne(id);
    if (request.status !== ExceptionStatus.PENDING) {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    // Apply Google Group Policy
    await this.googleAdminService.addGroupMember(this.EXCEPTION_GROUP_EMAIL, request.requesterEmail);

    request.status = ExceptionStatus.APPROVED;
    request.adminEmail = adminEmail;
    request.approvedAt = new Date();
    request.expiresAt = expiresAt;

    const saved = await this.exceptionRepository.save(request);
    this.logger.log(`Request ${id} approved by ${adminEmail}. Expires at ${expiresAt.toISOString()}`);
    
    // Update Slack message
    await this.slackService.updateNotificationAfterAction(saved, adminEmail);
    
    return saved;
  }

  async reject(id: string, adminEmail: string, comment?: string): Promise<ExceptionRequest> {
    const request = await this.findOne(id);
    if (request.status !== ExceptionStatus.PENDING) {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    request.status = ExceptionStatus.REJECTED;
    request.adminEmail = adminEmail;
    request.adminComment = comment;

    const saved = await this.exceptionRepository.save(request);
    this.logger.log(`Request ${id} rejected by ${adminEmail}`);
    
    // Update Slack message
    await this.slackService.updateNotificationAfterAction(saved, adminEmail);

    return saved;
  }

  /**
   * Automatic cleanup of expired exceptions
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredExceptions() {
    this.logger.debug('Checking for expired exception requests...');
    const now = new Date();
    const expiredRequests = await this.exceptionRepository.find({
      where: {
        status: ExceptionStatus.APPROVED,
        expiresAt: LessThan(now),
      },
    });

    for (const request of expiredRequests) {
      try {
        this.logger.log(`Expiring request ${request.id} for ${request.requesterEmail}`);
        
        // Remove from Google Group
        await this.googleAdminService.removeGroupMember(this.EXCEPTION_GROUP_EMAIL, request.requesterEmail);
        
        request.status = ExceptionStatus.EXPIRED;
        await this.exceptionRepository.save(request);
      } catch (error) {
        this.logger.error(`Failed to expire request ${request.id}: ${error.message}`);
      }
    }
  }

  async getHistory(limit: number = 50): Promise<ExceptionRequest[]> {
    return this.exceptionRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
