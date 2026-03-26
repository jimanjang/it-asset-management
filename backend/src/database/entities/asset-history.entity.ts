import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Asset } from './asset.entity';
import { Device } from './device.entity';

@Entity('asset_history')
export class AssetHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  asset_id: string;

  @ManyToOne(() => Asset, (a) => a.history)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ nullable: true })
  device_id: string;

  @ManyToOne(() => Device, (d) => d.history)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column()
  action: string; // created | assigned | returned | synced | status_changed | linked

  @Column({ nullable: true })
  old_value: string;

  @Column({ nullable: true })
  new_value: string;

  @Column({ nullable: true })
  changed_by: string;

  @CreateDateColumn()
  created_at: Date;
}
