import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { Asset, Device, AssetHistory, Assignment } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, Device, AssetHistory, Assignment])],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
