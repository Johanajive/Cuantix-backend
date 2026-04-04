import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Saving } from '../../entities/Saving.entity';
import { Finance } from '../../entities/finance.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DasboardSavingService {

  constructor(
    @InjectRepository(Saving)
    private readonly savingRepository: Repository<Saving>,

    @InjectRepository(Finance)
    private readonly financeRepository: Repository<Finance>,
  ) {}

  // ============================
  // 🔥 HELPERS CLAVE (FIX TIMEZONE)
  // ============================

  private formatLocalDate(date: Date): string {
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // sin UTC
  }

  // ============================
  // 🔥 MÉTODO PRINCIPAL (PROGRESO)
  // ============================

  async getProgress(userId: string, savingUuid: string, filter: string) {

    const saving = await this.savingRepository.findOne({
      where: { uuid: savingUuid, user: { uuid: userId } }
    });

    if (!saving) throw new Error('Saving not found');

    if (filter === 'total') {

      const finances = await this.financeRepository
        .createQueryBuilder('finance')
        .where('finance.savingUuid = :savingUuid', { savingUuid })
        .andWhere('finance.userUuid = :userId', { userId })
        .orderBy('finance.date', 'ASC')
        .getMany();

      const expectedFull = this.generateExpectedLine(saving);
      const actualFull   = this.generateActualLine(finances);

      return {
        expected: expectedFull.map(([date, value]) => ({ label: date,  value: Number(value) })),
        actual:   actualFull.map(([date,  value]) => ({ label: date,  value: Number(value) }))
      };
    }

    const { start, end } = this.getDateFilter(filter);

    const startDate = this.parseLocalDate(this.formatLocalDate(new Date(start)));
    const endDate   = this.parseLocalDate(this.formatLocalDate(new Date(end)));

    const finances = await this.financeRepository
      .createQueryBuilder('finance')
      .where('finance.savingUuid = :savingUuid', { savingUuid })
      .andWhere('finance.userUuid = :userId', { userId })
      .andWhere('finance.date BETWEEN :start AND :end', {
        start: this.formatLocalDate(startDate),
        end:   this.formatLocalDate(endDate)
      })
      .orderBy('finance.date', 'ASC')
      .getMany();

    const expectedFull = this.generateExpectedLine(saving);
    const actualFull   = this.generateActualLine(finances);

    const expectedMap = new Map<string, number>();
    const actualMap   = new Map<string, number>();

    let expected: any[] = [];

    if (filter === 'week') {

      const weekLabels = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
      weekLabels.forEach(label => expectedMap.set(label, 0));

      const savingStart = this.parseLocalDate(
        this.formatLocalDate(new Date(saving.startDate))
      );

      for (const [dateStr, value] of expectedFull) {
        const d = this.parseLocalDate(dateStr);
        if (d < savingStart) continue;
        if (d < startDate || d > endDate) continue;

        const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
        const label    = weekLabels[dayIndex];
        expectedMap.set(label, Number(value));
      }

      expected = weekLabels.map(label => ({
        label,
        value: expectedMap.get(label) || 0
      }));

    } else {

      for (const [date, value] of expectedFull) {
        const d = this.parseLocalDate(date);
        if (d >= startDate && d <= endDate) {
          const label = this.getLabel(d, filter);
          expectedMap.set(label, Number(value));
        }
      }

      const labels = this.generateLabels(filter);
      expected = labels.map(label => ({
        label,
        value: expectedMap.get(label) || 0
      }));
    }

    for (const [date, value] of actualFull) {
      const d = this.parseLocalDate(date);
      if (d >= startDate && d <= endDate) {
        const label = this.getLabel(d, filter);
        actualMap.set(label, Number(value));
      }
    }

    const labels   = this.generateLabels(filter);
    let accActual  = 0;

    const actual = labels.map(label => {
      if (actualMap.has(label)) {
        accActual = actualMap.get(label)!;
      }
      return { label, value: accActual };
    });

    return { expected, actual };
  }

  // ============================
  // 🔥 DONA
  // ============================

  async getSavingDonut(userId: string, savingUuid: string, filter: string) {

  const saving = await this.savingRepository.findOne({
    where: { uuid: savingUuid, user: { uuid: userId } },
    relations: ['finances'],
  });

  if (!saving) throw new NotFoundException('Saving not found');

  const { start, end } = this.getDateFilterr(filter, saving);

  const finances = await this.financeRepository
    .createQueryBuilder('finance')
    .where('finance.savingUuid = :savingUuid', { savingUuid })
    .andWhere('finance.userUuid = :userId', { userId })
    .andWhere('finance.date BETWEEN :start AND :end', { start, end })
    .orderBy('finance.date', 'ASC')
    .getMany();

  const totalSaved = finances.reduce((sum, f) => sum + Number(f.amount), 0);

  const expectedFull = this.generateExpectedLiner(saving);

  const endDate = this.parseLocalDate(end as string);
  const expectedAtEnd    = this.getExpectedAtDate(expectedFull, endDate);
  const expectedProgress = this.getPercentage(expectedAtEnd, Number(saving.targetAmount));
  const progress         = this.getPercentage(totalSaved,    Number(saving.targetAmount));

  const periodProgress = expectedAtEnd > 0
    ? Math.round((totalSaved / expectedAtEnd) * 100)
    : 0;

  const remaining = Math.max(expectedAtEnd - totalSaved, 0);

  let status = 'Vamos empezando';
  if (expectedAtEnd > 0) {
    if      (totalSaved >= expectedAtEnd)        status = 'Lo haz logrado';
    else if (totalSaved >= expectedAtEnd * 0.9)  status = 'Es todo tuyo';
    else if (totalSaved >= expectedAtEnd * 0.75) status = 'Excelente progreso';
    else if (totalSaved >= expectedAtEnd * 0.4)  status = 'Vas por buen camino';
    else                                          status = 'Vamos empezando';
  }

  return {
    totalSaved,
    expected:        expectedAtEnd,
    remaining,
    progress,
    expectedProgress,
    periodProgress,
    status,
  };
}



  // ============================
  // 🔥 OVERVIEW (ahora recibe filter)
  // ============================

  async getSavingOverview(userId: string, savingUuid: string, filter: string = 'total') {

  const saving = await this.savingRepository.findOne({
    where: { uuid: savingUuid, user: { uuid: userId } },
  });

  if (!saving) throw new NotFoundException('Saving not found');

  const { start, end } = this.getDateFilterr(filter, saving);

  // ✅ Finanzas filtradas por el periodo seleccionado
  const finances = await this.financeRepository
    .createQueryBuilder('finance')
    .where('finance.savingUuid = :savingUuid', { savingUuid })
    .andWhere('finance.userUuid = :userId', { userId })
    .andWhere('finance.date BETWEEN :start AND :end', { start, end })
    .getMany();

  const totalSaved = finances.reduce((sum, f) => sum + Number(f.amount), 0);

  // ✅ Para "Falta" usamos la meta esperada del periodo, igual que la dona
  const expectedFull   = this.generateExpectedLiner(saving);
  const endDate        = this.parseLocalDate(end as string);
  const expectedAtEnd  = this.getExpectedAtDate(expectedFull, endDate);

  const targetAmount   = Number(saving.targetAmount);
  const budget         = Number(saving.budget);

  // "Falta" = lo que se esperaba en el periodo menos lo que se lleva
  const remaining = Math.max(expectedAtEnd - totalSaved, 0);

  // Progreso respecto a la meta total (para el color de la barra)
  const progressTotal = targetAmount > 0
    ? Math.round((totalSaved / targetAmount) * 100)
    : 0;

  // Progreso respecto a lo esperado en el periodo (para la barra "Falta")  
  const progressPeriod = expectedAtEnd > 0
    ? Math.round((totalSaved / expectedAtEnd) * 100)
    : 0;

  const totalPayments = Math.ceil(targetAmount / budget);
  const paymentsDone  = Math.floor(totalSaved  / budget);

  const nextDueDate = this.formatLocalDate(
    this.parseLocalDate(saving.nextDueDate as any)
  );
  const estimatedEndDate = this.formatLocalDate(
    this.parseLocalDate(saving.estimatedEndDate as any)
  );

  return {
    name:            saving.name,
    imageUrl:        saving.imageUrl ?? null,
    frequency:       saving.frequency,
    isCompleted:     saving.isCompleted,
    isActive:        saving.isActive,
    targetAmount,
    expectedAtEnd,   // ✅ nuevo: meta del periodo
    totalSaved,
    remaining,
    budget,
    progressTotal,   // ✅ renombrado desde progress
    progressPeriod,  // ✅ nuevo: vs meta del periodo
    totalPayments,
    paymentsDone,
    nextDueDate,
    estimatedEndDate,
  };
}

  // ============================
  // 🔥 HELPERS INTERNOS
  // ============================

  // 🔥 FIX PRINCIPAL: <= en vez de < para incluir el día exacto
  private getExpectedAtDate(
    expectedFull: [string, number][],
    targetDate: Date
  ): number {

    let expected = 0;

    const target = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );

    for (const [dateStr, value] of expectedFull) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const localDate = new Date(y, m - 1, d);

      if (localDate <= target) {        // ✅ <= incluye el día actual
        expected = Number(value);
      } else {
        break;
      }
    }

    return expected;
  }

  private generateExpectedLine(saving: Saving) {
    const data: any[] = [];
    let current     = new Date(saving.startDate);
    let accumulated = 0;

    const totalPayments = Math.ceil(
      Number(saving.targetAmount) / Number(saving.budget)
    );

    for (let i = 0; i < totalPayments; i++) {
      accumulated += Number(saving.budget);
      if (accumulated > Number(saving.targetAmount)) {
        accumulated = Number(saving.targetAmount);
      }
      data.push([this.formatLocalDate(current), accumulated]);
      current = this.nextDate(current, saving.frequency);
    }

    return data;
  }

  private generateExpectedLiner(saving: Saving): [string, number][] {
    const data: [string, number][] = [];
    const startDateStr = typeof saving.startDate === 'string'
    ? saving.startDate
    : this.formatLocalDate(saving.startDate as Date);

  let current = this.parseLocalDate(startDateStr); // sin UTC ✓
    let accumulated = 0;

    const totalPayments = Math.ceil(
      Number(saving.targetAmount) / Number(saving.budget)
    );

    for (let i = 0; i < totalPayments; i++) {
      accumulated += Number(saving.budget);
      if (accumulated > Number(saving.targetAmount)) accumulated = Number(saving.targetAmount);
      data.push([this.formatDater(current), accumulated]);
      current = this.nextDate(current, saving.frequency);
    }

    return data;
  }

  private generateActualLine(finances: Finance[]): [string, number][] {
    let total = 0;

    const sorted = [...finances].sort((a, b) => {
      const [ay, am, ad] = a.date.split('-').map(Number);
      const [by, bm, bd] = b.date.split('-').map(Number);
      return new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime();
    });

    return sorted.map(f => {
      total += Number(f.amount);
      return [this.formatLocalDate(this.parseLocalDate(f.date)), total];
    });
  }

  private getLabel(date: Date, filter: string): string {
    if (filter === 'week') {
      const days  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
      const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
      return days[index];
    }
    if (filter === 'month') {
      const week = Math.ceil(date.getDate() / 7);
      return `Semana${Math.min(week, 4)}`;
    }
    if (filter === 'year') {
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return months[date.getMonth()];
    }
    return this.formatLocalDate(date);
  }

  private generateLabels(filter: string): string[] {
    if (filter === 'week')  return ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
    if (filter === 'month') return ['Semana1','Semana2','Semana3','Semana4'];
    if (filter === 'year')  return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return [];
  }

  private getDateFilter(filter: string) {
    const now = new Date();

    if (filter === 'week') {
      const day  = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);

      const start = new Date(now);
      start.setDate(diff);
      start.setHours(0,0,0,0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);

      return { start, end };
    }
    if (filter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23,59,59,999);
      return { start, end };
    }
    if (filter === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end   = new Date(now.getFullYear(), 11, 31);
      end.setHours(23,59,59,999);
      return { start, end };
    }

    return { start: now, end: now };
  }

  // ✅ REEMPLAZAR el método completo
private getDateFilterr(filter: string, saving: Saving) {
  const now = new Date();

  const startDateStr = typeof saving.startDate === 'string'
    ? saving.startDate
    : this.formatLocalDate(saving.startDate as any);

  const savingStart = this.parseLocalDate(startDateStr);

  // ✅ savingEnd = fecha del último pago (el primer pago ya es el día 0, 
  //    así que iteramos totalPayments-1 veces desde ahí)
  const totalPayments = Math.ceil(
    Number(saving.targetAmount) / Number(saving.budget)
  );

  let temp = new Date(savingStart);
  for (let i = 1; i < totalPayments; i++) {
    temp = this.nextDate(temp, saving.frequency);
  }
  const savingEnd = temp;

  // ✅ Helper: resta 1 día a cualquier fecha string 'YYYY-MM-DD'
  const subtractOneDay = (dateStr: string): string => {
    const d = this.parseLocalDate(dateStr);
    d.setDate(d.getDate() - 1);
    return this.formatLocalDate(d);
  };

  if (filter === 'total') {
    return {
      start: subtractOneDay(this.formatLocalDate(savingStart)), // ✅ día anterior al inicio
      end:   this.formatLocalDate(savingEnd),
      notStarted: false,
    };
  }

  let start: Date;
  let end: Date;

  switch (filter) {
    case 'week': {
      const dow = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dow === 0 ? 6 : dow - 1));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'year': {
      start = new Date(now.getFullYear(), 0, 1);
      end   = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    }
    default:
      return {
        start: subtractOneDay(this.formatLocalDate(savingStart)),
        end:   this.formatLocalDate(savingEnd),
        notStarted: false,
      };
  }

  // Ajustar al rango real del ahorro
  if (start < savingStart) start = new Date(savingStart);
  if (end > savingEnd)     end   = new Date(savingEnd);

  if (start > end) {
    return {
      start: subtractOneDay(this.formatLocalDate(start)),
      end:   this.formatLocalDate(start),
      notStarted: false,
    };
  }

  return {
    // ✅ Siempre restar 1 día al start para que el BETWEEN incluya el día exacto
    start: subtractOneDay(this.formatLocalDate(start)),
    end:   this.formatLocalDate(end),
    notStarted: false,
  };
}

  private nextDate(date: Date, frequency: string): Date {
    const next = new Date(date);
    switch (frequency) {
      case 'diario':   next.setDate(next.getDate() + 1);    break;
      case 'semanal':  next.setDate(next.getDate() + 7);    break;
      case 'mensual':  next.setMonth(next.getMonth() + 1);  break;
    }
    return next;
  }

  private formatDater(date: Date): string {
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getPercentage(value: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  }
}