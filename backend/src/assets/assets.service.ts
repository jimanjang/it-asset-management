import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Asset, Device, AssetHistory } from '../database/entities';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset) private assetsRepo: Repository<Asset>,
    @InjectRepository(Device) private devicesRepo: Repository<Device>,
    @InjectRepository(AssetHistory) private historyRepo: Repository<AssetHistory>,
  ) {}

  async findAll(query: { page?: number; limit?: number; status?: string; search?: string; category?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.assetsRepo.createQueryBuilder('asset')
      .leftJoinAndSelect('asset.device', 'device');

    if (query.search) {
      qb.andWhere(
        '(asset.asset_tag ILIKE :s OR asset.name ILIKE :s OR asset.serial_number ILIKE :s OR asset.model ILIKE :s)',
        { s: `%${query.search}%` },
      );
    }
    if (query.status) qb.andWhere('asset.status = :status', { status: query.status });
    if (query.category) qb.andWhere('asset.category = :cat', { cat: query.category });

    qb.orderBy('asset.created_at', 'DESC');
    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const asset = await this.assetsRepo.findOne({
      where: { id },
      relations: ['device', 'assignments', 'history'],
    });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    return asset;
  }

  async create(data: Partial<Asset>) {
    const asset = this.assetsRepo.create(data);
    const saved = await this.assetsRepo.save(asset);

    // Auto-link by serial number
    if (saved.serial_number) {
      const device = await this.devicesRepo.findOne({
        where: { serial_number: saved.serial_number, asset_id: IsNull() },
      });
      if (device) {
        device.asset_id = saved.id;
        await this.devicesRepo.save(device);
        await this.historyRepo.save(this.historyRepo.create({
          asset_id: saved.id,
          device_id: device.id,
          action: 'linked',
          new_value: `Auto-linked via serial number: ${saved.serial_number}`,
        }));
      }
    }

    await this.historyRepo.save(this.historyRepo.create({
      asset_id: saved.id,
      action: 'created',
      new_value: `Asset ${saved.asset_tag} created`,
    }));

    return saved;
  }

  async update(id: string, data: Partial<Asset>) {
    const asset = await this.findOne(id);
    const updated = await this.assetsRepo.save({ ...asset, ...data });
    return updated;
  }

  async linkDevice(assetId: string, body: { deviceId?: string; serialNumber?: string }) {
    const asset = await this.findOne(assetId);

    let device: Device | null = null;
    if (body.deviceId) {
      device = await this.devicesRepo.findOne({ where: { id: body.deviceId } });
    } else if (body.serialNumber) {
      device = await this.devicesRepo.findOne({ where: { serial_number: body.serialNumber } });
    }

    if (!device) throw new NotFoundException('Device not found');
    if (device.asset_id && device.asset_id !== assetId) {
      throw new BadRequestException('Device is already linked to another asset');
    }

    device.asset_id = assetId;
    await this.devicesRepo.save(device);

    await this.historyRepo.save(this.historyRepo.create({
      asset_id: assetId,
      device_id: device.id,
      action: 'linked',
      new_value: `Manually linked device ${device.serial_number}`,
    }));

    return { asset, device };
  }

  async getStats() {
    const total = await this.assetsRepo.count();
    const active = await this.assetsRepo.count({ where: { status: 'active' } });
    const inStock = await this.assetsRepo.count({ where: { status: 'in_stock' } });
    const maintenance = await this.assetsRepo.count({ where: { status: 'maintenance' } });
    const disposed = await this.assetsRepo.count({ where: { status: 'disposed' } });

    return { total, active, inStock, maintenance, disposed };
  }
}
