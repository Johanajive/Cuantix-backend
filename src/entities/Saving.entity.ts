import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Users } from './user.entity';
import { Finance } from './finance.entity';
import { Frequency } from '../enums/frequency.enum'; 

@Entity()
export class Saving {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  targetAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalSaved: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  budget: number; // cuánto paga cada periodo

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  nextDueDate: Date;

  @Column({ type: 'date' })
  estimatedEndDate: Date;

  @Column({
    type: 'enum',
    enum: Frequency,
  })
  frequency: Frequency;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isCompleted: boolean;

  @ManyToOne(() => Users, (user) => user.savings)
  user: Users;

  @OneToMany(() => Finance, (finance) => finance.saving)
  finances: Finance[];

  @CreateDateColumn()
  createdAt: Date;
}