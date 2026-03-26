import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from './device.entity';

@Entity('device_network')
export class DeviceNetwork {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  device_id: string;

  @ManyToOne(() => Device, (d) => d.networks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ nullable: true })
  mac_address: string;

  @Column({ nullable: true })
  lan_ip: string;

  @Column({ nullable: true })
  wan_ip: string;

  @Column({ nullable: true })
  network_type: string; // wifi | ethernet

  @Column()
  observed_at: Date;
}
