import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Asset } from './asset.entity';
import { User } from './user.entity';
import { Device } from './device.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  asset_id: string;

  @ManyToOne(() => Asset, (a) => a.assignments)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ nullable: true })
  user_id: string;

  @ManyToOne(() => User, (u) => u.assignments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  device_id: string;

  @ManyToOne(() => Device, (d) => d.assignments)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ type: 'date' })
  assigned_date: Date;

  @Column({ type: 'date', nullable: true })
  returned_date: Date;

  @Column({ default: 'active' })
  status: string; // active | returned

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
