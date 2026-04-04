import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./user.entity";
import { Agent } from "./agent.entity";

@Entity()
export class Review {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => Users)
  user: Users;

  @ManyToOne(() => Agent)
  agent: Agent;

  @Column()
  rating: number; // 1 a 5

  @Column()
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}