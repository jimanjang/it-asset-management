import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Device, Asset, SyncLog, Assignment } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Asset, SyncLog, Assignment])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
