import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from './device.entity';

@Entity('device_metrics')
export class DeviceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  device_id: string;

  @ManyToOne(() => Device, (d) => d.metrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ type: 'float', nullable: true })
  cpu_usage: number;

  @Column({ type: 'float', nullable: true })
  memory_usage: number;

  @Column({ type: 'bigint', nullable: true })
  disk_total: number;

  @Column({ type: 'bigint', nullable: true })
  disk_used: number;

  @Column({ type: 'float', nullable: true })
  temperature: number;

  @Column()
  collected_at: Date;
}
