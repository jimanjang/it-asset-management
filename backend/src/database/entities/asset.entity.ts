import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { Assignment } from './assignment.entity';
import { AssetHistory } from './asset-history.entity';
import { Device } from './device.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  asset_tag: string; // e.g., DS-CHR-001

  @Column()
  name: string;

  @Column({ default: 'laptop' })
  category: string; // laptop | desktop | monitor | peripheral

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  model: string;

  @Column({ unique: true, nullable: true })
  serial_number: string;

  @Column({ default: 'active' })
  status: string; // active | disposed | maintenance | in_stock

  @Column({ type: 'date', nullable: true })
  purchase_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchase_cost: number;

  @Column({ type: 'date', nullable: true })
  warranty_expiry: Date;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => Device, (d) => d.asset)
  device: Device;

  @OneToMany(() => Assignment, (a) => a.asset)
  assignments: Assignment[];

  @OneToMany(() => AssetHistory, (h) => h.asset)
  history: AssetHistory[];
}
