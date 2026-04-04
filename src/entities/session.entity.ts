import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Users } from './user.entity';
import { Agent } from './agent.entity';

export enum SessionStatus {
  PENDING = 'PENDING', 
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Session {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  // Fecha y hora que eligió el usuario en el calendario
  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  // Duración en minutos (por defecto 60)
  @Column({ default: 60 })
  durationMinutes: number;

  // Tema / motivo de la asesoría
  @Column()
  topic: string;

  // Notas adicionales del usuario
  @Column({type: 'varchar', nullable: true })
  notes: string | null;

  // Estado de la sesión
  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  status: SessionStatus;

  @CreateDateColumn()
  createdAt: Date;

  // El usuario que agendó
  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Users;

  // El agente con quien se agenda
  @ManyToOne(() => Agent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;
}