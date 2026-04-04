import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn,  } from "typeorm";
import { FinanceType } from "../enums/financeType.enum"; 
import { Users } from "./user.entity";
import { Investment } from "./Investment.entity";
import { Saving } from "./Saving.entity";

@Entity()
export class Finance {
    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false,
    })
    called: string;

    @Column({
        type: 'decimal',
        precision: 18,
        scale: 2,
        nullable: false,
    })
    amount: number;
    
    @Column({
        type: 'date',
        nullable: false,
    })
    date: string;

    @CreateDateColumn({//recuerda que esto lo agregastes hace poco debes modificar esta entidad para agregar el campo
    })
            createdAt: string;

    @Column({
        type: 'enum',
        enum: FinanceType,
        nullable: false,
    })
    financeType: FinanceType;

    @ManyToOne(() => Users, (users) => users.finances)
    @JoinColumn()
    user: Users;

    @ManyToOne(() => Investment, investment => investment.finances, { nullable: true })
@JoinColumn({ name: 'investmentUuid' })
investment: Investment;

@Column({
  type: 'decimal',
  precision: 18,
  scale: 2,
  default: 0,
})
generated: number;

@Column({
  type: 'boolean',
  default: false,
})
isFromRecurring: boolean;

@Column({
  type: 'date',
  nullable: true,
})
dueDate: string;

@ManyToOne(() => Saving, saving => saving.finances, { nullable: true })
@JoinColumn({ name: 'savingUuid' })
saving: Saving;
}