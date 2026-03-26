import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { Device, DeviceMetric, DeviceNetwork, DeviceUser, Asset, AssetHistory } from '../database/entities';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, DeviceMetric, DeviceNetwork, DeviceUser, Asset, AssetHistory]),
    SyncModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
