import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Users } from './user.entity';

export enum NotificationType {
  REMINDER  = 'REMINDER',
  DUE_TODAY = 'DUE_TODAY',
}

export enum NotificationSource {
  SAVING     = 'SAVING',
  INVESTMENT = 'INVESTMENT',
  RECURRING  = 'RECURRING',
  FINANCE    = 'FINANCE',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 400 })
  body: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationSource })
  source: NotificationSource;

  @Column({ type: 'varchar', nullable: true })
  sourceUuid: string;

  // Para distinguir GASTO vs INGRESO en RECURRING
  @Column({ type: 'varchar', length: 20, nullable: true })
  financeType: string;

  // Ya la vio el usuario (se pone en true al abrir/marcar)
  @Column({ default: false })
  isRead: boolean;

  // 🔥 NUEVO: false = descartada por el usuario, nunca más se lista ni se recrea
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Users, (user) => user.notifications)
  user: Users;
}