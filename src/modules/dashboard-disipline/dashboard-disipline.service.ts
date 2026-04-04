import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Finance } from '../../entities/finance.entity';
import { FinanceType } from '../../enums/financeType.enum';

export interface DisciplineStats {
  early: number;
  onTime: number;
  late: number;
  total: number;
  earlyPct: number;
  onTimePct: number;
  latePct: number;
}

export interface DisciplineChartPoint {
  label: string;
  early: number;
  onTime: number;
  late: number;
}

export interface DisciplineDonutItem {
  name: string;
  value: number;
  pct: number;
}

@Injectable()
export class DashboardDisiplineService {
  private readonly logger = new Logger(DashboardDisiplineService.name);

  constructor(
    @InjectRepository(Finance)
    private readonly financeRepository: Repository<Finance>,
  ) {}

  // ==============================
  // RESUMEN GENERAL (barras)
  // ==============================
  async getDisciplineSummary(userId: string, filter: string): Promise<DisciplineStats> {
    const payments = await this.getPayments(userId, filter);
    this.logger.debug(`[summary] filter=${filter} | encontrados=${payments.length}`);

    let early = 0, onTime = 0, late = 0;

    for (const payment of payments) {
      const status = this.classifyPayment(payment.date, payment.dueDate);
      if (status === 'early') early++;
      else if (status === 'onTime') onTime++;
      else late++;
    }

    const total = early + onTime + late;

    return {
      early,
      onTime,
      late,
      total,
      earlyPct: total > 0 ? Math.round((early / total) * 100) : 0,
      onTimePct: total > 0 ? Math.round((onTime / total) * 100) : 0,
      latePct: total > 0 ? Math.round((late / total) * 100) : 0,
    };
  }

  // ==============================
  // DATOS PARA GRÁFICA DE BARRAS
  // ==============================
  async getDisciplineChart(userId: string, filter: string): Promise<DisciplineChartPoint[]> {
    const payments = await this.getPayments(userId, filter);
    this.logger.debug(`[chart] filter=${filter} | encontrados=${payments.length}`);

    const labels = this.generateLabels(filter);
    const earlyMap = new Map<string, number>();
    const onTimeMap = new Map<string, number>();
    const lateMap = new Map<string, number>();

    for (const payment of payments) {
      const label = this.getLabel(payment.date, filter);
      if (!label) continue;

      const status = this.classifyPayment(payment.date, payment.dueDate);
      if (status === 'early') earlyMap.set(label, (earlyMap.get(label) || 0) + 1);
      else if (status === 'onTime') onTimeMap.set(label, (onTimeMap.get(label) || 0) + 1);
      else lateMap.set(label, (lateMap.get(label) || 0) + 1);
    }

    return labels.map((label) => ({
      label,
      early: earlyMap.get(label) || 0,
      onTime: onTimeMap.get(label) || 0,
      late: lateMap.get(label) || 0,
    }));
  }

  // ==============================
  // DONA — distribución adelantados / exactos / atrasados
  // El 100% = total de pagos del período
  // ==============================
  async getDisciplineDonut(userId: string, filter: string): Promise<DisciplineDonutItem[]> {
    const payments = await this.getPayments(userId, filter);
    this.logger.debug(`[donut] filter=${filter} | encontrados=${payments.length}`);

    let early = 0, onTime = 0, late = 0;

    for (const payment of payments) {
      const status = this.classifyPayment(payment.date, payment.dueDate);
      if (status === 'early') early++;
      else if (status === 'onTime') onTime++;
      else late++;
    }

    const total = early + onTime + late;

    if (total === 0) return [];

    return [
      {
        name: 'Adelantados',
        value: early,
        pct: Math.round((early / total) * 100),
      },
      {
        name: 'Exactos',
        value: onTime,
        pct: Math.round((onTime / total) * 100),
      },
      {
        name: 'Atrasados',
        value: late,
        pct: Math.round((late / total) * 100),
      },
    ];
  }

  // ==============================
  // QUERY BASE COMPARTIDA
  // ==============================
  private async getPayments(userId: string, filter: string) {
    const { start, end } = this.getDateRange(filter);
    this.logger.debug(`[query] userId=${userId} | start=${start} | end=${end}`);

    return this.financeRepository
      .createQueryBuilder('finance')
      .where('finance.userUuid = :userId', { userId })
      .andWhere('finance.isFromRecurring = :isRecurring', { isRecurring: true })
      .andWhere('finance.date BETWEEN :start AND :end', { start, end })
      .select([
        'finance.uuid',
        'finance.date',
        'finance.dueDate',
        'finance.isFromRecurring',
      ])
      .getMany();
  }

  // ==============================
  // CLASIFICAR PAGO
  // ==============================
  private classifyPayment(
    paymentDate: string | Date,
    dueDate: string | Date | null,
  ): 'early' | 'onTime' | 'late' {
    if (!dueDate) return 'onTime';

    const paidStr = typeof paymentDate === 'string'
      ? paymentDate.substring(0, 10)
      : paymentDate.toISOString().split('T')[0];

    const dueStr = typeof dueDate === 'string'
      ? dueDate.substring(0, 10)
      : dueDate.toISOString().split('T')[0];

    if (paidStr < dueStr) return 'early';
    if (paidStr === dueStr) return 'onTime';
    return 'late';
  }

  // ==============================
  // RANGO DE FECHAS
  // ==============================
  private getDateRange(filter: string): { start: string; end: string } {
    const now = new Date();

    if (filter === 'week') {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0],
      };
    }

    if (filter === 'year') {
      return {
        start: `${now.getFullYear()}-01-01`,
        end: `${now.getFullYear()}-12-31`,
      };
    }

    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  // ==============================
  // LABEL POR FILTRO
  // ==============================
  private getLabel(dateStr: string | Date, filter: string): string | null {
    const str = typeof dateStr === 'string'
      ? dateStr.substring(0, 10)
      : dateStr.toISOString().split('T')[0];

    const [y, m, d] = str.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (filter === 'week') {
      const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const dayIndex = date.getDay();
      const adjusted = dayIndex === 0 ? 6 : dayIndex - 1;
      return days[adjusted];
    }

    if (filter === 'month') {
      return `Semana ${Math.ceil(d / 7)}`;
    }

    if (filter === 'year') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return months[m - 1];
    }

    return null;
  }

  // ==============================
  // LABELS EJE X
  // ==============================
  private generateLabels(filter: string): string[] {
    if (filter === 'week') return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    if (filter === 'month') return ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    if (filter === 'year') return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                                    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return [];
  }
}