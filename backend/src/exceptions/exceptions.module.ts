import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionsService } from './exceptions.service';
import { ExceptionsController } from './exceptions.controller';
import { ExceptionRequest } from '../database/entities';
import { SyncModule } from '../sync/sync.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExceptionRequest]),
    SyncModule, // Provides GoogleAdminService
    NotificationsModule, // Provides SlackService
  ],
  providers: [ExceptionsService],
  controllers: [ExceptionsController],
  exports: [ExceptionsService],
})
export class ExceptionsModule {}
