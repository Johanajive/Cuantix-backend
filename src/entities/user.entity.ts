import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { RoleEnum } from '../enums/role.enum'; 
import { Gender } from '../enums/gender.enum'; 
import { Exclude } from 'class-transformer';
import { Finance } from './finance.entity';
import { FacturaPago } from './facturaPago.entity';
import { Notification } from './notification.entity';
import { Agent } from './agent.entity';
import { Investment } from './Investment.entity';
import { Saving } from './Saving.entity';
import { RecurringFinance } from './recurringFinance.entity';


@Entity()
export class Users {
    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column({ type: 'varchar', length: 15, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 25, nullable: false })
    lastName: string;

    @Column({ type: 'varchar', length: 90, nullable: false })
    as: string;

    @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    phone: string;

    @Column({ type: 'date', nullable: true })
    birthDate: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @Column({ type: 'varchar', length: 12, nullable: true })
    idCard: string;

    @Column({ type: 'enum', enum: Gender, nullable: true })
    gender: Gender;

    @Column({ type: 'enum', enum: RoleEnum, default: RoleEnum.USERFREE, nullable: false })
    role: RoleEnum;

    @Column({ type: 'varchar', nullable: true })
    avatar: string;

    @Column({ nullable: false })
    password: string;

    @Column({ nullable: false, default: true })
    @Exclude()
    status: boolean;

    @Column({ type: 'varchar', default: 'PENDING' })
    subscriptionStatus: string;

    @Column({ default: false })
    isPremium: boolean;

    @Column({ type: 'varchar', length: 6, nullable: true })
    resetPin: string | null;

    @Column({ type: 'timestamp', nullable: true })
    resetPinExpires: Date | null;

    @Column({ type: 'datetime', nullable: true })
    subscriptionExpiresAt: Date;

    @Column({ default: false })
    isApproved: boolean;

    @Column({ default: false })
    isRejected: boolean;

    @OneToMany(() => Notification, notification => notification.user)
    notifications: Notification[];

    @OneToMany(() => Finance, (finance) => finance.user)
    finances: Finance[];

    @OneToMany(() => FacturaPago, (facturaPago) => facturaPago.user)
    facturasPagadas: FacturaPago[];

    @OneToMany(() => RecurringFinance, (recurringFinance) => recurringFinance.user)
    recurringFinances: RecurringFinance[];

    @OneToMany(() => Agent, agent => agent.user)
    agentProfile: Agent[];

    @OneToMany(() => Investment, (investment) => investment.user)
    investments: Investment[];

    @OneToMany(() => Saving, (saving) => saving.user)
    savings: Saving[];

    @Column({ nullable: true })
    fcmToken: string;
}
