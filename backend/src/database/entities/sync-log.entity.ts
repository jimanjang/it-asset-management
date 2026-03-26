import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'full' })
  sync_type: string; // full | delta

  @Column({ default: 'running' })
  status: string; // running | completed | failed

  @Column({ default: 0 })
  devices_found: number;

  @Column({ default: 0 })
  devices_created: number;

  @Column({ default: 0 })
  devices_updated: number;

  @Column({ default: 0 })
  devices_unchanged: number;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column()
  started_at: Date;

  @Column({ nullable: true })
  completed_at: Date;
}
