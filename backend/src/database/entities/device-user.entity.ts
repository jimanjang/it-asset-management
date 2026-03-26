import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from './device.entity';

@Entity('device_users')
export class DeviceUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  device_id: string;

  @ManyToOne(() => Device, (d) => d.device_users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column()
  email: string;

  @Column({ default: 'recent' })
  type: string; // recent | enrolled

  @Column({ nullable: true })
  last_seen: Date;
}
