import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Users } from '../entities/user.entity';
import { FinanceType } from '../enums/financeType.enum';   
import { Frequency } from '../enums/frequency.enum';

@Entity()
export class RecurringFinance {

    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column({
        type: 'varchar',
        length: 60,
        nullable: false,
    })
    name: string;
    

    @Column({
        type: 'decimal',
        nullable: false,
    })
    amount: number;

    @Column({
        type: 'enum',
        enum: FinanceType
    })
    financeType: FinanceType;

    @Column({
        type: 'enum',
        enum: Frequency
    })  
    frequency: Frequency;

    @CreateDateColumn()
        createdAt: Date;

    @Column({
        type: 'date',
        nullable: false,
    })
    nextDueDate: string;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Users, user => user.recurringFinances)
    user: Users;
}
