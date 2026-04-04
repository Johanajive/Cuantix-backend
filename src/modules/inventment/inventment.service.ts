import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from '../../entities/Investment.entity';
import { Users } from '../../entities/user.entity';
import { Finance } from '../../entities/finance.entity';
import { CreateInvestmentDto } from './dto/CreateInvestmentDto';
import { AddInvestmentAmountDto } from './dto/AddInvestmentAmountDto';
import { Frequency } from '../../enums/frequency.enum';
import { FinanceType } from '../../enums/financeType.enum';

@Injectable()
export class InventmentService {
  constructor(
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,

    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,

    @InjectRepository(Finance)
    private readonly financeRepository: Repository<Finance>,
  ) {}

  // ==============================
  // CREAR INVERSIÓN
  // ==============================
  async create(createDto: CreateInvestmentDto, userId: string) {
    const user = await this.usersRepository.findOne({
      where: { uuid: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const investment = this.investmentRepository.create({
      ...createDto,
      totalInvested: 0,
      totalGenerated: 0,
      isActive: true,
      isOverdue: false,
      user,
    });

    return this.investmentRepository.save(investment);
  }

  // ==============================
  // MARCAR COMO PAGADO
  // ==============================
  async markAsPaid(
  investmentId: string,
  dto: AddInvestmentAmountDto,
  userId: string,
) {
  const investment = await this.investmentRepository.findOne({
    where: {
      uuid: investmentId,
      user: { uuid: userId },
    },
  });

  if (!investment) {
    throw new NotFoundException('Inversión no encontrada');
  }

  const today = new Date().toISOString().split('T')[0];

  // 1️⃣ Crear movimiento
  const finance = this.financeRepository.create({
    called: investment.name,
    amount: Number(dto.amount),
    generated: Number(dto.generated || 0),
    date: today,
    financeType: FinanceType.INVERSION,
    user: { uuid: userId },
    investment: { uuid: investment.uuid },
  });

  await this.financeRepository.save(finance);

  
  const newNextDate = this.calculateNextDate(
  new Date(), // 👈 usar HOY
  investment.frequency,
);


  investment.nextDueDate = newNextDate;
  investment.isOverdue = false;

  await this.investmentRepository.save(investment);

  return finance;
}


  // ==============================
  // CALCULAR SIGUIENTE FECHA
  // ==============================
  private calculateNextDate(date: Date, frequency: Frequency): Date {
  const next = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  switch (frequency) {
    case Frequency.DIARIO:
      next.setDate(next.getDate() + 1);
      break;

    case Frequency.SEMANAL:
      next.setDate(next.getDate() + 7);
      break;

    case Frequency.QUINCENAL:
      next.setDate(next.getDate() + 15);
      break;

    case Frequency.MENSUAL:
      next.setMonth(next.getMonth() + 1);
      break;

    case Frequency.FINMES:
      next.setMonth(next.getMonth() + 1);
      next.setDate(0); // último día del mes
      break;

    case Frequency.ANUAL:
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

  // ==============================
  // VERIFICAR SI ESTÁ VENCIDA
  // ==============================
  private checkOverdue(investment: Investment): Investment {
    if (new Date() > new Date(investment.nextDueDate)) {
      investment.isOverdue = true;
    }
    return investment;
  }

  // ==============================
// LISTAR INVERSIONES DEL USUARIO
// ==============================
async findAllByUser(userId: string) {
  const investments = await this.investmentRepository
    .createQueryBuilder('investment')
    .leftJoinAndSelect('investment.finances', 'finance')
    .leftJoinAndSelect('investment.user', 'user')
    .where('user.uuid = :userId', { userId })
    .andWhere('investment.isActive = true')
    .orderBy('investment.createdAt', 'DESC')
    .getMany();

  return investments.map(inv => {

    const totalInvested = inv.finances?.reduce(
      (sum, f) => sum + Number(f.amount),
      0,
    ) || 0;

    const totalGenerated = inv.finances?.reduce(
      (sum, f) => sum + Number(f.generated || 0),
      0,
    ) || 0;

    const profitPercentage =
      totalInvested > 0
        ? (totalGenerated / totalInvested) * 100
        : 0;

        const today = new Date();
today.setHours(0,0,0,0);

const due = new Date(inv.nextDueDate);
due.setHours(0,0,0,0);

const isOverdue = today > due;
    return {
      ...inv,
      totalInvested,
      totalGenerated,
      profitPercentage,
      isOverdue,
    };
  });
}

async updateFrequency(
  investmentUuid: string,
  frequency: Frequency,
  userUuid: string,
) {
  const investment = await this.investmentRepository.findOne({
    where: {
      uuid: investmentUuid,
      user: { uuid: userUuid },
    },
  });

  if (!investment) {
    throw new NotFoundException('Investment not found');
  }

  investment.frequency = frequency;

  return this.investmentRepository.save(investment);
}

// ==============================
// ELIMINAR INVERSION (DELETE LOGICO)
// ==============================
async deleteInvestment(uuid: string, userUuid: string) {

  const investment = await this.investmentRepository.findOne({
    where: {
      uuid,
      user: { uuid: userUuid },
    },
  });

  if (!investment) {
    throw new NotFoundException('Inversión no encontrada');
  }

  investment.isActive = false;

  return this.investmentRepository.save(investment);
}

}