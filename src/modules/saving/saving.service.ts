import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Finance } from '../../entities/finance.entity';
import { Saving } from '../../entities/Saving.entity';
import { FinanceType } from '../../enums/financeType.enum';
import { Frequency } from '../../enums/frequency.enum';
import { Repository } from 'typeorm';
import { CreateSavingDto } from './dto/CreateSavingDto';
import { AddSavingAmountDto } from './dto/AddSavingAmountDto';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception.js';

@Injectable()
export class SavingService {
    constructor(
        @InjectRepository(Saving)
        private readonly savingRepository: Repository<Saving>,
        @InjectRepository(Finance)
        private readonly financeRepository: Repository<Finance>,
    ){}

  // ============================
  // 🔥 HELPER: parsear fecha SIN UTC
  // ============================
  private parseLocalDate(dateStr: string | Date): Date {
    const str = typeof dateStr === 'string'
      ? dateStr
      : (dateStr as Date).toISOString().split('T')[0];
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day); // sin UTC, hora local
  }

  // ============================
  // CREAR META
  // ============================
  async create(dto: CreateSavingDto, userId: string) {

  const start = new Date(dto.startDate);

  // 🔥 FIX: sumar 1 día
  start.setDate(start.getDate() + 1);

  const startDateOnly = start.toISOString().split('T')[0];

  const estimatedEndDate = this.calculateEstimatedEndDate(
    new Date(startDateOnly),
    dto.targetAmount,
    dto.budget,
    dto.frequency,
  );

  const saving = this.savingRepository.create({
    ...dto,
    startDate: startDateOnly,
    nextDueDate: startDateOnly,
    estimatedEndDate,
    totalSaved: 0,
    user: { uuid: userId },
  });

  return this.savingRepository.save(saving);
}


  // ============================
  // AGREGAR AHORRO
  // ============================
  async addSavingAmount(
    savingUuid: string,
    dto: AddSavingAmountDto,
    userId: string,
  ) {
    const saving = await this.savingRepository.findOne({
      where: {
        uuid: savingUuid,
        user: { uuid: userId },
      },
    });

    if (!saving) {
      throw new NotFoundException('Meta no encontrada');
    }

    const dueDate = new Date(saving.nextDueDate)
      .toISOString()
      .split('T')[0];

    const today = new Date().toISOString().split('T')[0];

    const finance = this.financeRepository.create({
      called: saving.name,
      amount: dto.amount,
      dueDate: dueDate,
      date: today,
      financeType: FinanceType.AHORRO,
      user: { uuid: userId },
      saving: { uuid: saving.uuid },
    });

    await this.financeRepository.save(finance);

    // 🔥 FIX: decidir baseDate ANTES de sumar el nuevo monto
    let baseDate: Date;
    if (Number(saving.totalSaved) <= 0) {
      // Primer pago — partir desde startDate
      baseDate = this.parseLocalDate(saving.startDate as any);
    } else {
      // Ya había pagos previos — partir desde nextDueDate
      baseDate = this.parseLocalDate(saving.nextDueDate as any);
    }

    // Ahora sí sumamos
    saving.totalSaved = Number(saving.totalSaved) + Number(dto.amount);

    const nextDate = this.calculateNextDate(baseDate, saving.frequency);

    console.log('baseDate usado:', baseDate);
    console.log('Siguiente fecha calculada:', nextDate);
    console.log('Frecuencia:', saving.frequency);

    saving.nextDueDate = nextDate;

    if (saving.totalSaved >= saving.targetAmount) {
      saving.isCompleted = true;
      saving.isActive = false;
    }

    await this.savingRepository.save(saving);

    return finance;
  }

  // ============================
  // LISTAR METAS
  // ============================
  async findAllByUser(userId: string) {
  return this.savingRepository.find({
    where: {
      user: { uuid: userId },
      isActive: true,
    },
    relations: ['finances'],
    order: { createdAt: 'DESC' },
  });
}

  // ============================
  // CALCULAR FECHA ESTIMADA
  // ============================
  private calculateEstimatedEndDate(
    startDate: Date,
    targetAmount: number,
    budget: number,
    frequency: Frequency,
  ): Date {
    const paymentsNeeded = Math.ceil(targetAmount / budget);
    const endDate = new Date(startDate);

    switch (frequency) {
      case Frequency.DIARIO:
        endDate.setDate(endDate.getDate() + paymentsNeeded);
        break;
      case Frequency.SEMANAL:
        endDate.setDate(endDate.getDate() + paymentsNeeded * 7);
        break;
      case Frequency.MENSUAL:
        endDate.setMonth(endDate.getMonth() + paymentsNeeded);
        break;
      case Frequency.ANUAL:
        endDate.setFullYear(endDate.getFullYear() + paymentsNeeded);
        break;
      case Frequency.QUINCENAL:
        endDate.setDate(endDate.getDate() + paymentsNeeded * 15);
        break;
      case Frequency.FINMES:
        endDate.setMonth(endDate.getMonth() + paymentsNeeded);
        endDate.setDate(0);
        break;
    }

    return endDate;
  }

  // ============================
  // CALCULAR SIGUIENTE FECHA
  // ============================
  private calculateNextDate(date: Date, frequency: Frequency): Date {
    // 🔥 FIX: construir desde componentes locales para evitar desfase UTC
    const next = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    switch (frequency) {
      case Frequency.DIARIO:
        next.setDate(next.getDate() + 1);
        break;

      case Frequency.SEMANAL:
        next.setDate(next.getDate() + 7);
        break;

      case Frequency.QUINCENAL: {
        const day = next.getDate();
        if (day < 15) {
          next.setDate(15);
        } else {
          next.setMonth(next.getMonth() + 1);
          next.setDate(0);
        }
        break;
      }

      case Frequency.MENSUAL:
        next.setMonth(next.getMonth() + 1);
        break;

      case Frequency.FINMES: {
        next.setMonth(next.getMonth() + 1);
        next.setDate(0);
        break;
      }

      case Frequency.ANUAL:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    console.log('Fecha base para calcular siguiente:', date);
    console.log('Frecuencia:', frequency);
    console.log('Siguiente fecha calculada:', next);

    return next;
  }

  // ============================
  // ELIMINAR META (DELETE LOGICO)
  // ============================
  async deleteSaving(uuid: string, userId: string) {

    const saving = await this.savingRepository.findOne({
      where: {
        uuid,
        user: { uuid: userId },
      },
    });

    if (!saving) {
      throw new NotFoundException('Meta no encontrada');
    }

    saving.isActive = false;

    return this.savingRepository.save(saving);
  }

}