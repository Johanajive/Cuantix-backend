import { PlanType } from "../enums/planType.enum"; 
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Users } from "./user.entity";

@Entity()
export class FacturaPago {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ unique: true })
  paymentId: string; // Mercado Pago ID

  @Column()
  status: string; // approved, pending, rejected

  @Column('decimal')
  amount: number;

  @Column()
  currency: string;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  plan: PlanType;

  @Column()
  paidAt: Date;

  @ManyToOne(() => Users, (user) => user.facturasPagadas)
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
