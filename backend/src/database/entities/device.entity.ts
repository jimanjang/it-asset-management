import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { Asset } from './asset.entity';
import { DeviceMetric } from './device-metric.entity';
import { DeviceNetwork } from './device-network.entity';
import { DeviceUser } from './device-user.entity';
import { Assignment } from './assignment.entity';
import { AssetHistory } from './asset-history.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  google_device_id: string;

  @Column({ unique: true, nullable: true })
  serial_number: string;

  @Column({ nullable: true })
  asset_id: string;

  @OneToOne(() => Asset, (a) => a.device)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  os_version: string;

  @Column({ nullable: true })
  platform_version: string;

  @Column({ nullable: true })
  firmware_version: string;

  @Column({ nullable: true })
  boot_mode: string;

  @Column({ nullable: true })
  cpu_model: string;

  @Column({ type: 'bigint', nullable: true })
  ram_total: number;

  @Column({ default: 'ACTIVE' })
  status: string; // ACTIVE | DISABLED | DEPROVISIONED

  @Column({ nullable: true })
  compliance_status: string;

  @Column({ nullable: true })
  assigned_user: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  annotated_location: string;

  @Column({ nullable: true })
  google_asset_id: string;

  @Column({ nullable: true })
  annotated_asset_id: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  mac_address: string;

  @Column({ type: 'simple-json', nullable: true })
  hardware_info: any;

  @Column({ nullable: true })
  org_unit_path: string;

  @Column({ nullable: true })
  enrollment_time: Date;

  @Column({ nullable: true })
  last_google_sync: Date;

  @Column({ nullable: true })
  last_activity_time: Date;

  @Column({ nullable: true })
  last_synced_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => DeviceMetric, (m) => m.device)
  metrics: DeviceMetric[];

  @OneToMany(() => DeviceNetwork, (n) => n.device)
  networks: DeviceNetwork[];

  @OneToMany(() => DeviceUser, (u) => u.device)
  device_users: DeviceUser[];

  @OneToMany(() => Assignment, (a) => a.device)
  assignments: Assignment[];

  @OneToMany(() => AssetHistory, (h) => h.device)
  history: AssetHistory[];
}
