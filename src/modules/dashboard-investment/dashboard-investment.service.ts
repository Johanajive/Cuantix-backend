import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Finance } from '../../entities/finance.entity';
import { Investment } from '../../entities/Investment.entity';

@Injectable()
export class DashboardInvestmentService {

  constructor(
    @InjectRepository(Finance)
    private readonly financeRepository: Repository<Finance>,

    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,
  ) {}

  // ============================
  // 🔥 GRÁFICA INVERTIDO vs GENERADO
  // ============================

  async getInvestmentChart(userId: string, investmentUuid: string, filter: string) {

    const investment = await this.investmentRepository.findOne({
      where: { uuid: investmentUuid, user: { uuid: userId } },
    });

    if (!investment) throw new Error('Investment not found');

    if (filter === 'total') {

      const finances = await this.financeRepository
        .createQueryBuilder('finance')
        .where('finance.investmentUuid = :investmentUuid', { investmentUuid })
        .andWhere('finance.userUuid = :userId', { userId })
        .orderBy('finance.date', 'ASC')
        .getMany();

      const investedMap  = new Map<string, number>();
      const generatedMap = new Map<string, number>();

      let accInvested  = 0;
      let accGenerated = 0;

      for (const f of finances) {
        const [y, m, d] = f.date.split('-').map(Number);
        const label = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        accInvested  += Number(f.amount);
        accGenerated += Number(f.generated || 0);

        investedMap.set(label, accInvested);
        generatedMap.set(label, accGenerated);
      }

      const allLabels = Array.from(
        new Set([...investedMap.keys(), ...generatedMap.keys()])
      ).sort();

      return {
        invested:  allLabels.map(label => ({ label, value: investedMap.get(label)  ?? 0 })),
        generated: allLabels.map(label => ({ label, value: generatedMap.get(label) ?? 0 })),
      };
    }

    const { start, end } = this.getDateFilter(filter);

    const finances = await this.financeRepository
      .createQueryBuilder('finance')
      .where('finance.investmentUuid = :investmentUuid', { investmentUuid })
      .andWhere('finance.userUuid = :userId', { userId })
      .andWhere('finance.date BETWEEN :start AND :end', {
        start: start.toISOString().split('T')[0],
        end:   end.toISOString().split('T')[0],
      })
      .orderBy('finance.date', 'ASC')
      .getMany();

    const investedMap  = new Map<string, number>();
    const generatedMap = new Map<string, number>();

    for (const f of finances) {
      const [y, m, d] = f.date.split('-').map(Number);
      const date = new Date(y, m - 1, d);

      const label = this.getLabel(date, filter);

      investedMap.set(label,  (investedMap.get(label)  || 0) + Number(f.amount));
      generatedMap.set(label, (generatedMap.get(label) || 0) + Number(f.generated || 0));
    }

    const labels  = this.generateLabels(filter);
    const convert = (map: Map<string, number>) =>
      labels.map(label => ({ label, value: map.get(label) || 0 }));

    return {
      invested:  convert(investedMap),
      generated: convert(generatedMap),
    };
  }

  // ============================
  // 🔥 RESUMEN GENERAL
  // ============================

  async getInvestmentSummary(userId: string, investmentUuid: string, filter: string) {

    const finances = await this.getFinancesForFilter(userId, investmentUuid, filter);

    let totalInvested  = 0;
    let totalGenerated = 0;

    for (const f of finances) {
      totalInvested  += Number(f.amount);
      totalGenerated += Number(f.generated || 0);
    }

    const realProfit       = totalGenerated - totalInvested;
    const profitPercentage = totalInvested > 0
      ? (realProfit / totalInvested) * 100
      : 0;

    return {
      totalInvested,
      totalGenerated,
      realProfit,
      profitPercentage: Number(profitPercentage.toFixed(2)),
    };
  }

  // ============================
  // 🔥 DONUT PRINCIPAL (MODIFICADO ✔)
  // ============================

  // En DashboardInvestmentService — solo este método cambia:

async getInvestmentDonut(userId: string, investmentUuid: string, filter: string) {

  const finances = await this.getFinancesForFilter(userId, investmentUuid, filter);

  let totalInvested  = 0;
  let totalGenerated = 0;

  for (const f of finances) {
    totalInvested  += Number(f.amount);
    totalGenerated += Number(f.generated || 0);
  }

  // ✅ ANTES: devolvía Invertido + Ganancia real
  // ✅ AHORA: devuelve Invertido + Generado
  return [
    { name: 'Invertido', value: totalInvested  },
    { name: 'Generado',  value: totalGenerated },
  ];
}

  // ============================
  // 🔥 DONUT BREAKDOWN
  // ============================

  async getInvestmentDonutBreakdown(userId: string, investmentUuid: string, filter: string) {

    const finances = await this.getFinancesForFilter(userId, investmentUuid, filter);

    let totalInvested  = 0;
    let totalGenerated = 0;

    for (const f of finances) {
      totalInvested  += Number(f.amount);
      totalGenerated += Number(f.generated || 0);
    }

    const realProfit = totalGenerated - totalInvested;

    const profitPct = totalInvested > 0
      ? Number(((realProfit / totalInvested) * 100).toFixed(1))
      : 0;

    const generatedPct = totalInvested > 0
      ? Number(((totalGenerated / totalInvested) * 100).toFixed(1))
      : 0;

    return {
      items: [
        { name: 'Generado',      value: totalGenerated },
        { name: 'Ganancia real', value: realProfit > 0 ? realProfit : 0 },
      ],
      totalInvested,
      totalGenerated,
      realProfit,
      profitPct,
      generatedPct,
    };
  }

  // ============================
  // 🔥 BARRA
  // ============================

  async getInvestmentBar(userId: string, investmentUuid: string, filter: string) {

    const finances = await this.getFinancesForFilter(userId, investmentUuid, filter);

    let totalInvested  = 0;
    let totalGenerated = 0;

    for (const f of finances) {
      totalInvested  += Number(f.amount);
      totalGenerated += Number(f.generated || 0);
    }

    const realProfit = totalGenerated - totalInvested;
    const max        = Math.max(totalInvested, totalGenerated);

    const profitPct = totalInvested > 0
      ? Number(((realProfit / totalInvested) * 100).toFixed(1))
      : 0;

    return { totalInvested, totalGenerated, realProfit, profitPct, max };
  }

  

  // ============================
  // 🔥 HELPERS
  // ============================

  private async getFinancesForFilter(userId: string, investmentUuid: string, filter: string) {

    const qb = this.financeRepository
      .createQueryBuilder('finance')
      .where('finance.investmentUuid = :investmentUuid', { investmentUuid })
      .andWhere('finance.userUuid = :userId', { userId });

    if (filter !== 'total') {
      const { start, end } = this.getDateFilter(filter);
      qb.andWhere('finance.date BETWEEN :start AND :end', {
        start: start.toISOString().split('T')[0],
        end:   end.toISOString().split('T')[0],
      });
    }

    return qb.orderBy('finance.date', 'ASC').getMany();
  }

  private getLabel(date: Date, filter: string): string {

    if (filter === 'week') {
      const days  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
      return days[index];
    }

    if (filter === 'month') {
      const week = Math.ceil(date.getDate() / 7);
      return `Semana${Math.min(week, 4)}`;
    }

    if (filter === 'year') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return months[date.getMonth()];
    }

    return date.toISOString().split('T')[0];
  }

  private generateLabels(filter: string): string[] {

    if (filter === 'week')  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    if (filter === 'month') return ['Semana1', 'Semana2', 'Semana3', 'Semana4'];
    if (filter === 'year')  return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return [];
  }

  private getDateFilter(filter: string) {

    const now = new Date();

    if (filter === 'week') {
      const day  = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);

      const start = new Date(now);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    if (filter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (filter === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end   = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    return {
      start: new Date(2000, 0, 1),
      end:   new Date(2100, 11, 31),
    };
  }
}