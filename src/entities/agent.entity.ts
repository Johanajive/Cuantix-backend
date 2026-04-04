import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Users } from './user.entity';

@Entity()
export class Agent {
    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column({ type: 'text' })
    experience: string;

    @Column()
    specialty: string;

    @Column({ type: 'varchar', nullable: true })
    documentUrl: string | null;

    @Column({ type: 'varchar', nullable: true })
    diplomaUrl: string | null;

    @ManyToOne(() => Users, user => user.agentProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: Users;
}