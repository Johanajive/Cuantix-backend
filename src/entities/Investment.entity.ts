import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany
} from 'typeorm';
import { Users } from './user.entity'; 
import { Frequency } from '../enums/frequency.enum'; 
import { Finance } from './finance.entity';

@Entity()
export class Investment {

  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column()
  name: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  nextDueDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({
    type: 'enum',
    enum: Frequency,
  })
  frequency: Frequency;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalInvested: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalGenerated: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isOverdue: boolean;

  @ManyToOne(() => Users, (user) => user.investments)
  user: Users;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Finance, finance => finance.investment)
finances: Finance[];

}
