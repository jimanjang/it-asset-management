import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, LessThan } from 'typeorm';
import { Device, Asset, SyncLog } from '../database/entities';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Device) private devicesRepo: Repository<Device>,
    @InjectRepository(Asset) private assetsRepo: Repository<Asset>,
    @InjectRepository(SyncLog) private syncLogsRepo: Repository<SyncLog>,
  ) {}

  async getSummary() {
    const totalDevices = await this.devicesRepo.count();
    const activeDevices = await this.devicesRepo.count({ where: { status: 'ACTIVE' } });
    const disabledDevices = await this.devicesRepo.count({ where: { status: 'DISABLED' } });
    const deprovisionedDevices = await this.devicesRepo.count({ where: { status: 'DEPROVISIONED' } });

    const totalAssets = await this.assetsRepo.count();
    const linkedDevices = await this.devicesRepo.count({ where: { asset_id: Not(IsNull()) } });
    const unlinkedDevices = totalDevices - linkedDevices;

    // Problem devices
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const inactiveDevices = await this.devicesRepo.count({
      where: { last_activity_time: LessThan(thirtyDaysAgo), status: 'ACTIVE' },
    });

    // Last sync info
    const lastSync = await this.syncLogsRepo.findOne({
      order: { completed_at: 'DESC' },
      where: { status: 'completed' },
    });

    // OS version distribution
    const osVersions = await this.devicesRepo
      .createQueryBuilder('device')
      .select('device.os_version', 'version')
      .addSelect('COUNT(*)', 'count')
      .where('device.os_version IS NOT NULL')
      .groupBy('device.os_version')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    // Model distribution
    const models = await this.devicesRepo
      .createQueryBuilder('device')
      .select('device.model', 'model')
      .addSelect('COUNT(*)', 'count')
      .where('device.model IS NOT NULL')
      .groupBy('device.model')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      devices: {
        total: totalDevices,
        active: activeDevices,
        disabled: disabledDevices,
        deprovisioned: deprovisionedDevices,
      },
      assets: {
        total: totalAssets,
        linked: linkedDevices,
        unlinked: unlinkedDevices,
      },
      problems: {
        inactive: inactiveDevices,
        disabled: disabledDevices,
        unlinked: unlinkedDevices,
      },
      lastSync: lastSync ? {
        completedAt: lastSync.completed_at,
        devicesUpdated: lastSync.devices_updated,
        devicesCreated: lastSync.devices_created,
      } : null,
      osVersions,
      models,
    };
  }
}
