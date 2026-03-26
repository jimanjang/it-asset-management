import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { GoogleAdminService } from './google-admin.service';
import { Device, DeviceMetric, DeviceNetwork, DeviceUser, Asset, AssetHistory, SyncLog } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Device, DeviceMetric, DeviceNetwork, DeviceUser, Asset, AssetHistory, SyncLog])],
  controllers: [SyncController],
  providers: [SyncService, GoogleAdminService],
  exports: [SyncService, GoogleAdminService],
})
export class SyncModule {}
