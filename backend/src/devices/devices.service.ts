import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan, IsNull, Not } from 'typeorm';
import { Device, DeviceMetric, DeviceNetwork, DeviceUser, AssetHistory } from '../database/entities';
import { GoogleAdminService } from '../sync/google-admin.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepo: Repository<Device>,
    @InjectRepository(DeviceMetric)
    private metricsRepo: Repository<DeviceMetric>,
    @InjectRepository(DeviceNetwork)
    private networkRepo: Repository<DeviceNetwork>,
    @InjectRepository(DeviceUser)
    private deviceUserRepo: Repository<DeviceUser>,
    @InjectRepository(AssetHistory)
    private historyRepo: Repository<AssetHistory>,
    private googleAdminService: GoogleAdminService,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    hasAsset?: string;
    inactiveDays?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.devicesRepo.createQueryBuilder('device')
      .leftJoinAndSelect('device.asset', 'asset');

    // Search filter
    if (query.search) {
      qb.andWhere(
        '(device.serial_number ILIKE :search OR device.model ILIKE :search OR device.assigned_user ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Status filter
    if (query.status) {
      qb.andWhere('device.status = :status', { status: query.status });
    }

    // Has asset filter
    if (query.hasAsset === 'true') {
      qb.andWhere('device.asset_id IS NOT NULL');
    } else if (query.hasAsset === 'false') {
      qb.andWhere('device.asset_id IS NULL');
    }

    // Inactive days filter
    if (query.inactiveDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - query.inactiveDays);
      qb.andWhere('device.last_activity_time < :cutoff', { cutoff: cutoffDate });
    }

    // Sorting
    const sortBy = query.sortBy || 'last_google_sync';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`device.${sortBy}`, sortOrder);

    // Pagination
    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const device = await this.devicesRepo.findOne({
      where: { id },
      relations: ['asset', 'device_users'],
    });

    if (!device) {
      throw new NotFoundException(`Device ${id} not found`);
    }

    // Get latest network info
    const network = await this.networkRepo.findOne({
      where: { device_id: id },
      order: { observed_at: 'DESC' },
    });

    // Get latest metrics
    const latestMetrics = await this.metricsRepo.findOne({
      where: { device_id: id },
      order: { collected_at: 'DESC' },
    });

    // Get recent history
    const history = await this.historyRepo.find({
      where: { device_id: id },
      order: { created_at: 'DESC' },
      take: 20,
    });

    return {
      ...device,
      network,
      latestMetrics,
      history,
    };
  }

  async findMetrics(deviceId: string, range: string = '24h') {
    const device = await this.devicesRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException(`Device ${deviceId} not found`);

    const now = new Date();
    let since: Date;
    switch (range) {
      case '7d': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      default: since = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
    }

    const metrics = await this.metricsRepo.find({
      where: {
        device_id: deviceId,
        collected_at: LessThan(now) as any,
      },
      order: { collected_at: 'ASC' },
    });

    return {
      deviceId,
      range,
      metrics: metrics.filter((m) => m.collected_at >= since),
    };
  }

  async getProblematicDevices() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Inactive devices (30+ days)
    const inactive = await this.devicesRepo.count({
      where: { last_activity_time: LessThan(thirtyDaysAgo), status: 'ACTIVE' },
    });

    // Disabled devices
    const disabled = await this.devicesRepo.count({
      where: { status: 'DISABLED' },
    });

    // Unlinked devices (no asset)
    const unlinked = await this.devicesRepo.count({
      where: { asset_id: IsNull() },
    });

    return { inactive, disabled, unlinked };
  }

  async getStats() {
    const total = await this.devicesRepo.count();
    const active = await this.devicesRepo.count({ where: { status: 'ACTIVE' } });
    const disabled = await this.devicesRepo.count({ where: { status: 'DISABLED' } });
    const deprovisioned = await this.devicesRepo.count({ where: { status: 'DEPROVISIONED' } });
    const linked = await this.devicesRepo.count({ where: { asset_id: Not(IsNull()) } });

    return { total, active, disabled, deprovisioned, linked, unlinked: total - linked };
  }

  async updateCustomFields(id: string, payload: { annotatedUser?: string; annotatedAssetId?: string; annotatedLocation?: string; notes?: string }) {
    const device = await this.devicesRepo.findOne({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    // 1. Update Google Admin Workspace
    try {
      await this.googleAdminService.updateDevice(device.google_device_id, payload);
    } catch (error) {
      // If it fails, we throw to let the frontend know the sync failed
      throw new Error('Failed to update Google Admin. Ensure the service account has "admin.directory.device.chromeos" scope.');
    }

    // 2. Update Local DB
    if (payload.annotatedUser !== undefined) device.assigned_user = payload.annotatedUser;
    if (payload.annotatedAssetId !== undefined) device.annotated_asset_id = payload.annotatedAssetId;
    if (payload.annotatedLocation !== undefined) device.annotated_location = payload.annotatedLocation;
    if (payload.notes !== undefined) device.notes = payload.notes;

    // Optional: Log History edit
    const history = new AssetHistory();
    history.device_id = device.id;
    history.action = 'status_changed';
    history.new_value = `Custom fields updated manually via Dashboard`;
    await this.historyRepo.save(history);

    return this.devicesRepo.save(device);
  }

  async getChromeReports(deviceId: string): Promise<any[]> {
    const device = await this.findOne(deviceId);
    if (!device || !device.serial_number) return [];
    return this.googleAdminService.getDeviceReports(device.serial_number);
  }

  async getAllChromeReports(limit: number = 50): Promise<any[]> {
    if (!this.googleAdminService.isReady()) return [];
    try {
      return this.googleAdminService.getDeviceReports(''); // Empty serial means all
    } catch (error) {
      return [];
    }
  }
}
