import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ExceptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum ExceptionType {
  GROUP_POLICY = 'GROUP_POLICY',
  OU_MOVE = 'OU_MOVE',
  RELAY = 'RELAY',
}

@Entity('exception_requests')
export class ExceptionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requesterEmail: string;

  @Column({ nullable: true })
  filename: string;

  @Column('text')
  url: string;

  @Column('text')
  reason: string;

  @Column({
    type: 'varchar',
    enum: ExceptionStatus,
    default: ExceptionStatus.PENDING,
  })
  status: ExceptionStatus;

  @Column({
    type: 'varchar',
    enum: ExceptionType,
    default: ExceptionType.GROUP_POLICY,
  })
  type: ExceptionType;

  @Column({ nullable: true })
  adminEmail: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true })
  adminComment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
