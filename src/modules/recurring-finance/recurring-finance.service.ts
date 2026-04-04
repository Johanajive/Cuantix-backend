import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringFinance } from '../../entities/recurringFinance.entity';
import { Finance } from '../../entities/finance.entity';
import { Users } from '../../entities/user.entity';
import { CreateRecurringFinanceDto } from './dto/CreateRecurringFinanceDto';
import { NotFoundException } from '@nestjs/common';
import { Frequency } from '../../enums/frequency.enum';
import { ForbiddenException } from '@nestjs/common';
import { UpdateRecurringFinanceDto } from './dto/UpdateRecurringFinanceDto';


@Injectable()
export class RecurringFinanceService {
    constructor(
        @InjectRepository(RecurringFinance)
        private readonly recurringRepository: Repository<RecurringFinance>,
    
        @InjectRepository(Finance)
        private readonly financeRepository: Repository<Finance>,
    
        @InjectRepository(Users)
        private readonly usersRepository: Repository<Users>,
    ){}

    async createRecurringFinanceService(createRecurringFinanceDto: CreateRecurringFinanceDto, userId: string) {
        const user = await this.usersRepository.findOne({
            where: {uuid: userId}
        })

        if(!user){
            throw new NotFoundException('User not found');
        }

        // 🔥 ajustar fecha si es FIN DE MES
let nextDueDate = createRecurringFinanceDto.nextDueDate;

if (createRecurringFinanceDto.frequency === Frequency.FINMES) {
  const [year, month] = nextDueDate.split('-').map(Number);

  // último día del mes seleccionado
  const lastDay = new Date(Date.UTC(year, month, 0));

  nextDueDate = lastDay.toISOString().split('T')[0];
}

const recurringFinance = this.recurringRepository.create({
  ...createRecurringFinanceDto,
  nextDueDate,
  user: user
});
        return await this.recurringRepository.save(recurringFinance);
    }

    async getAllRecurringFinancesByUserId(userId: string) {
        const recurringFinance = await this.recurringRepository.find({
            where: {user: {uuid: userId}, isActive: true},
            order: {nextDueDate: 'ASC'}// esto es para ordenar por fecha de vencimiento, entonces queda de la mas cercana a la mas lejana de venser
        })
        return recurringFinance;
    }

    async createFinanceFromRecurringFinanceService(uuid: string, userId: string) {
        console.log("UUID:", uuid);
        console.log("User:", userId);
    const recurringFinance = await this.recurringRepository.findOne({
        where: { uuid },
        relations: ['user']
    });

    if (!recurringFinance) {
        throw new NotFoundException('Recurring finance not found');
    }

    if (recurringFinance.user.uuid !== userId) {
        throw new ForbiddenException('No tienes permiso');
    }

    // Crear movimiento real
    // En createFinanceFromRecurringFinanceService, reemplaza el save del finance por esto:

await this.financeRepository.save({
  called: recurringFinance.name,
  amount: recurringFinance.amount,
  financeType: recurringFinance.financeType,
  date: new Date().toISOString().split('T')[0], // fecha real de pago = HOY
  dueDate: recurringFinance.nextDueDate,        // ✅ fecha límite = la fecha de vencimiento del recurrente
  user: recurringFinance.user,
  isFromRecurring: true,
});
    console.log("ANTES:", recurringFinance.nextDueDate);

    // Si es único, desactivar
    if (recurringFinance.frequency === Frequency.UNICO) {
        recurringFinance.isActive = false;
    } else {
        recurringFinance.nextDueDate = this.calculateNextDate(
  recurringFinance.nextDueDate as unknown as string,
  recurringFinance.frequency,
);
    }
    console.log("DESPUÉS:", recurringFinance.nextDueDate);

    return this.recurringRepository.save(recurringFinance);
}


   private calculateNextDate(current: string, frequency: Frequency): string {
  const [year, month, day] = current.split('-').map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  switch (frequency) {
    case Frequency.DIARIO:
      date.setUTCDate(date.getUTCDate() + 1);
      break;

    case Frequency.SEMANAL:
      date.setUTCDate(date.getUTCDate() + 7);
      break;

    case Frequency.QUINCENAL:
      date.setUTCDate(date.getUTCDate() + 15);
      break;

    case Frequency.MENSUAL:
      date.setUTCMonth(date.getUTCMonth() + 1);
      break;

    case Frequency.FINMES: {
      // avanzar al siguiente mes
      const nextMonth = date.getUTCMonth() + 1;
      const nextYear = date.getUTCFullYear();

      // último día del siguiente mes
      const lastDay = new Date(Date.UTC(nextYear, nextMonth + 1, 0));

      return lastDay.toISOString().split('T')[0];
    }

    case Frequency.ANUAL:
      date.setUTCFullYear(date.getUTCFullYear() + 1);
      break;
  }

  return date.toISOString().split('T')[0];
}

  // Desactivar fijo
    async deletedeRecurringFinanceService(uuid: string, userId: string) {

    const recurringFinance = await this.recurringRepository.findOne({
        where: { uuid },
        relations: ['user'],
    });

    if (!recurringFinance) {
        throw new NotFoundException('Recurring finance does not found');
    }

    if (recurringFinance.user.uuid !== userId) {
        throw new ForbiddenException('No tienes permiso');
    }

    recurringFinance.isActive = false;

    return this.recurringRepository.save(recurringFinance);
    }

    async editRecurringFinanceService(uuid: string, updateRecurringFinanceDto: UpdateRecurringFinanceDto, userId: string) {
    const recurringFinance = await this.recurringRepository.findOne({
        where: { uuid },
        relations: ['user'],    
    });
    if (!recurringFinance) {
        throw new NotFoundException('Recurring finance does not found');
    }
    if (recurringFinance.user.uuid !== userId) {
        throw new ForbiddenException('No tienes permiso');
    }

    if (updateRecurringFinanceDto.nextDueDate) {
    recurringFinance.nextDueDate = updateRecurringFinanceDto.nextDueDate as any;
    }

    Object.assign(recurringFinance, updateRecurringFinanceDto);
    return this.recurringRepository.save(recurringFinance);
}

async getOverdueRecurring(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  return this.recurringRepository
    .createQueryBuilder('recurring')
    .where('recurring.userUuid = :userId', { userId })
    .andWhere('recurring.isActive = true')
    .andWhere('recurring.nextDueDate < :today', { today })
    .orderBy('recurring.nextDueDate', 'ASC')
    .getMany();
}
}