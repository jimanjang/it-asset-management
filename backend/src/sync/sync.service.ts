import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoogleAdminService } from './google-admin.service';
import { Device, DeviceMetric, DeviceNetwork, DeviceUser, Asset, AssetHistory, SyncLog } from '../database/entities';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private isSyncing = false;

  constructor(
    private googleAdmin: GoogleAdminService,
    @InjectRepository(Device) private devicesRepo: Repository<Device>,
    @InjectRepository(DeviceMetric) private metricsRepo: Repository<DeviceMetric>,
    @InjectRepository(DeviceNetwork) private networkRepo: Repository<DeviceNetwork>,
    @InjectRepository(DeviceUser) private deviceUserRepo: Repository<DeviceUser>,
    @InjectRepository(Asset) private assetsRepo: Repository<Asset>,
    @InjectRepository(AssetHistory) private historyRepo: Repository<AssetHistory>,
    @InjectRepository(SyncLog) private syncLogsRepo: Repository<SyncLog>,
  ) {}

  /**
   * Delta sync every 15 minutes
   */
  @Cron(CronExpression.EVERY_HOUR) // Reduced frequency to avoid HMR loops in dev
  async handleDeltaSync() {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping...');
      return;
    }
    // Only run delta every 15 min in production
    const now = new Date();
    if (process.env.NODE_ENV === 'production' && now.getMinutes() % 15 !== 0) return;

    await this.syncDevices('delta');
  }

  /**
   * Full sync daily at 2:00 AM
   */
  @Cron('0 2 * * *')
  async handleFullSync() {
    await this.syncDevices('full');
  }

  /**
   * Manual sync trigger
   */
  async triggerSync(type: 'full' | 'delta' = 'full') {
    if (this.isSyncing) {
      return { status: 'already_running', message: 'Sync is already in progress' };
    }
    // Don't await — run in background
    this.syncDevices(type).catch((err) => this.logger.error('Sync error:', err));
    return { status: 'started', type };
  }

  /**
   * Core sync logic
   */
  async syncDevices(type: 'full' | 'delta') {
    this.isSyncing = true;
    const syncLog = this.syncLogsRepo.create({
      sync_type: type,
      status: 'running',
      started_at: new Date(),
    });
    await this.syncLogsRepo.save(syncLog);

    this.logger.log(`🔄 Starting ${type} sync...`);

    try {
      // Fetch devices from Google
      let googleDevices;
      if (type === 'delta') {
        const lastSync = await this.getLastSuccessfulSync();
        if (lastSync) {
          googleDevices = await this.googleAdmin.fetchDevicesSince(lastSync.completed_at);
        } else {
          googleDevices = await this.googleAdmin.fetchAllDevices();
        }
      } else {
        googleDevices = await this.googleAdmin.fetchAllDevices();
      }

      syncLog.devices_found = googleDevices.length;
      let created = 0;
      let updated = 0;
      let unchanged = 0;

      for (const gDevice of googleDevices) {
        const result = await this.upsertDevice(gDevice);
        if (result === 'created') created++;
        else if (result === 'updated') updated++;
        else unchanged++;
      }

      syncLog.devices_created = created;
      syncLog.devices_updated = updated;
      syncLog.devices_unchanged = unchanged;
      syncLog.status = 'completed';
      syncLog.completed_at = new Date();

      this.logger.log(
        `✅ Sync completed: ${created} created, ${updated} updated, ${unchanged} unchanged`,
      );
    } catch (error) {
      syncLog.status = 'failed';
      syncLog.error_message = error.message;
      syncLog.completed_at = new Date();
      this.logger.error(`❌ Sync failed: ${error.message}`);
    } finally {
      await this.syncLogsRepo.save(syncLog);
      this.isSyncing = false;
    }
  }

  /**
   * Upsert a single device from Google API data
   */
  private async upsertDevice(gDevice: any): Promise<'created' | 'updated' | 'unchanged'> {
    let device = await this.devicesRepo.findOne({
      where: { google_device_id: gDevice.deviceId },
    });

    const now = new Date();
    const cpuModel = gDevice.cpuInfo?.[0]?.model || undefined;
    const ramTotal = gDevice.memoryInfo?.totalRam ? parseInt(gDevice.memoryInfo.totalRam) : undefined;

    const deviceData: any = {
      google_device_id: gDevice.deviceId,
      serial_number: gDevice.serialNumber || undefined,
      model: gDevice.model || undefined,
      os_version: gDevice.osVersion || undefined,
      platform_version: gDevice.platformVersion || undefined,
      firmware_version: gDevice.firmwareVersion || undefined,
      boot_mode: gDevice.bootMode || undefined,
      cpu_model: cpuModel,
      ram_total: ramTotal,
      status: gDevice.status || 'ACTIVE',
      assigned_user: gDevice.annotatedUser || undefined,
      location: gDevice.annotatedLocation || undefined,
      annotated_location: gDevice.annotatedLocation || undefined,
      google_asset_id: gDevice.annotatedAssetId || undefined,
      annotated_asset_id: gDevice.annotatedAssetId || undefined,
      notes: gDevice.notes || undefined,
      mac_address: gDevice.macAddress || gDevice.ethernetMacAddress || undefined,
      org_unit_path: gDevice.orgUnitPath || undefined,
      enrollment_time: gDevice.firstEnrollmentTime || gDevice.lastEnrollmentTime 
        ? new Date(gDevice.firstEnrollmentTime || gDevice.lastEnrollmentTime) 
        : undefined,
      last_google_sync: gDevice.lastSync ? new Date(gDevice.lastSync) : undefined,
      last_activity_time: gDevice.activeTimeRanges?.[0]?.date
        ? new Date(gDevice.activeTimeRanges[0].date)
        : undefined,
      last_synced_at: now,
      hardware_info: {
        cpuInfo: gDevice.cpuInfo,
        cpuStatusReports: gDevice.cpuStatusReports,
        diskSpaceUsage: gDevice.diskSpaceUsage,
        diskVolumeReports: gDevice.diskVolumeReports,
        systemRamTotal: gDevice.systemRamTotal,
        systemRamFreeReports: gDevice.systemRamFreeReports,
        macAddress: gDevice.macAddress,
        ethernetMacAddress: gDevice.ethernetMacAddress,
        lastKnownNetwork: gDevice.lastKnownNetwork,
        tpmVersionInfo: gDevice.tpmVersionInfo,
        osUpdateStatus: gDevice.osUpdateStatus,
        displayInfo: gDevice.displayInfo,
        audioStatusReport: gDevice.audioStatusReport,
      },
    };

    let result: 'created' | 'updated' | 'unchanged';

    if (!device) {
      device = Object.assign(new Device(), deviceData);
      await this.devicesRepo.save(device);
      result = 'created';

      await this.historyRepo.save(this.historyRepo.create({
        device_id: device.id,
        action: 'created',
        new_value: '디바이스 최초 동기화',
      }));
    } else {
      // Check if anything changed
      const hasChanges =
        device.os_version !== deviceData.os_version ||
        device.status !== deviceData.status ||
        device.assigned_user !== deviceData.assigned_user ||
        device.annotated_location !== deviceData.annotated_location ||
        device.annotated_asset_id !== deviceData.annotated_asset_id ||
        device.last_google_sync?.toISOString() !== deviceData.last_google_sync?.toISOString();

      if (hasChanges) {
        // Track status changes
        if (device.status !== deviceData.status) {
          await this.historyRepo.save(this.historyRepo.create({
            device_id: device.id,
            asset_id: device.asset_id,
            action: 'status_changed',
            old_value: device.status,
            new_value: deviceData.status as string,
            changed_by: 'sync_worker',
          }));
        }

        // Track user changes
        if (device.assigned_user !== deviceData.assigned_user) {
          await this.historyRepo.save(this.historyRepo.create({
            device_id: device.id,
            asset_id: device.asset_id,
            action: 'assigned',
            old_value: device.assigned_user || '없음',
            new_value: deviceData.assigned_user || '할당 해제됨',
            changed_by: 'sync_worker',
          }));
        }

        Object.assign(device, deviceData);
        await this.devicesRepo.save(device);
        result = 'updated';
      } else {
        device.last_synced_at = now;
        device.hardware_info = deviceData.hardware_info; // Always keep fresh
        await this.devicesRepo.save(device);
        result = 'unchanged';
      }
    }

    // Auto-register or link as Asset if missing
    if (device.serial_number && !device.asset_id) {
      await this.ensureAssetLink(device, gDevice);
    }

    // Upsert network info
    if (gDevice.lastKnownNetwork?.[0] || gDevice.macAddress) {
      await this.upsertNetwork(device.id, gDevice);
    }

    // Upsert recent users
    if (gDevice.recentUsers?.length) {
      await this.upsertDeviceUsers(device.id, gDevice.recentUsers);
    }

    // Upsert metrics from reports
    await this.upsertMetrics(device.id, gDevice);

    return result;
  }

  /**
   * Ensures a device is linked to an asset. Creates a new asset if none exists.
   */
  private async ensureAssetLink(device: Device, gDevice: any) {
    if (!device.serial_number) return;

    let asset = await this.assetsRepo.findOne({
      where: { serial_number: device.serial_number },
    });

    if (!asset) {
      // Create new Asset if missing
      this.logger.log(`Creating new automated asset for SN: ${device.serial_number}`);
      asset = this.assetsRepo.create({
        asset_tag: device.annotated_asset_id || `CHROME-${device.serial_number}`,
        name: `${device.model || 'Chrome Device'} (${device.serial_number})`,
        category: 'ChromeOS',
        manufacturer: 'Google/Partner',
        model: device.model,
        serial_number: device.serial_number,
        status: 'active',
        location: device.annotated_location,
        notes: '동기화 시 자동으로 등록된 자산입니다.',
      });

      try {
        asset = await this.assetsRepo.save(asset);
      } catch (e) {
        // Handle unique constraint on asset_tag if it exists
        this.logger.warn(`Asset tag collision for ${asset.asset_tag}, retrying with serial...`);
        asset.asset_tag = `CHROME-${device.serial_number}`;
        asset = await this.assetsRepo.save(asset);
      }
    }

    // Link asset to device
    device.asset_id = asset.id;
    await this.devicesRepo.save(device);

    await this.historyRepo.save(this.historyRepo.create({
      asset_id: asset.id,
      device_id: device.id,
      action: 'linked',
      new_value: `자산 자동 등록 및 연결: 시리얼번호 ${device.serial_number}`,
    }));
  }

  private async upsertNetwork(deviceId: string, gDevice: any) {
    const networkData: Partial<DeviceNetwork> = {
      device_id: deviceId,
      mac_address: gDevice.macAddress || gDevice.ethernetMacAddress || null,
      lan_ip: gDevice.lastKnownNetwork?.[0]?.ipAddress || null,
      wan_ip: gDevice.lastKnownNetwork?.[0]?.wanIpAddress || null,
      network_type: gDevice.ethernetMacAddress ? 'ethernet' : 'wifi',
      observed_at: new Date(),
    };

    const existing = await this.networkRepo.findOne({
      where: { device_id: deviceId },
      order: { observed_at: 'DESC' },
    });

    if (!existing || existing.lan_ip !== networkData.lan_ip || existing.mac_address !== networkData.mac_address) {
      await this.networkRepo.save(this.networkRepo.create(networkData));
    }
  }

  private async upsertDeviceUsers(deviceId: string, recentUsers: any[]) {
    // Remove old entries
    await this.deviceUserRepo.delete({ device_id: deviceId });

    for (const ru of recentUsers) {
      if (ru.email) {
        await this.deviceUserRepo.save(this.deviceUserRepo.create({
          device_id: deviceId,
          email: ru.email,
          type: ru.type === 'USER_TYPE_MANAGED' ? 'enrolled' : 'recent',
          last_seen: new Date(),
        }));
      }
    }
  }

  private async upsertMetrics(deviceId: string, gDevice: any) {
    const diskInfo = gDevice.diskVolumeReports?.[0]?.volumeInfo?.[0];
    if (!diskInfo) return;

    const diskTotal = diskInfo.storageTotal ? parseInt(diskInfo.storageTotal) : null;
    const diskFree = diskInfo.storageFree ? parseInt(diskInfo.storageFree) : null;
    const diskUsed = diskTotal && diskFree ? diskTotal - diskFree : null;

    // Only create a new metric if 1 hour has passed since last one
    const lastMetric = await this.metricsRepo.findOne({
      where: { device_id: deviceId },
      order: { collected_at: 'DESC' },
    });

    const now = new Date();
    if (lastMetric && now.getTime() - lastMetric.collected_at.getTime() < 3600000) {
      return; // Too recent
    }

    const metric = new DeviceMetric();
    metric.device_id = deviceId;
    metric.disk_total = diskTotal;
    metric.disk_used = diskUsed;
    metric.memory_usage = diskTotal ? ((diskUsed || 0) / diskTotal) * 100 : undefined;
    metric.collected_at = now;
    await this.metricsRepo.save(metric);
  }

  async getStatus() {
    const logs = await this.syncLogsRepo.find({ order: { started_at: 'DESC' }, take: 1 });
    const latest = logs.length > 0 ? logs[0] : null;
    return {
      isSyncing: this.isSyncing,
      lastSync: latest || null,
      googleApiConfigured: this.googleAdmin.isReady(),
    };
  }

  async getLogs(limit: number = 20) {
    return this.syncLogsRepo.find({
      order: { started_at: 'DESC' },
      take: limit,
    });
  }

  private async getLastSuccessfulSync(): Promise<SyncLog | null> {
    return this.syncLogsRepo.findOne({
      where: { status: 'completed' },
      order: { completed_at: 'DESC' },
    });
  }
}
