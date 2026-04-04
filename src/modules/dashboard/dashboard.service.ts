import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Finance } from '../../entities/finance.entity';
import { FinanceType } from '../../enums/financeType.enum';
import { RecurringFinance } from '../../entities/recurringFinance.entity';
import { Saving } from '../../entities/Saving.entity';
import { Investment } from '../../entities/Investment.entity';

@Injectable()
export class DashboardService {

  constructor(
    @InjectRepository(Finance)
    private readonly financeRepository: Repository<Finance>,
    @InjectRepository(Saving)
private readonly savingRepository: Repository<Saving>,
    @InjectRepository(RecurringFinance)
    private readonly recurringFinanceRepository: Repository<RecurringFinance>,
    @InjectRepository(Investment)
private readonly investmentRepository: Repository<Investment>,
  ) {}

  // ============================
// getSummary — agregar AHORRO e INVERSION a gastos
// ============================
async getSummary(userId: string, filter: string) {

  const { start, end } = this.getDateFilter(filter);

  const finances = await this.financeRepository
    .createQueryBuilder('finance')
    .where('finance.userUuid = :userId', { userId })
    .andWhere('finance.date BETWEEN :start AND :end', {
      start: start.toISOString().split("T")[0],
      end:   end.toISOString().split("T")[0]
    })
    .getMany();

  let gastos     = 0;
  let ingresos   = 0;
  let ahorros    = 0;
  let inversiones = 0;
  let balance    = 0;

  for (const f of finances) {
    const amount = Number(f.amount);

    switch (f.financeType) {

      case 'INGRESO':
        ingresos += amount;
        balance  += amount;
        break;

      case 'GASTO':
        gastos  += amount;
        balance -= amount;
        break;

      case 'AHORRO':
        ahorros += amount;
        gastos  += amount; // ✅ ahorro cuenta como gasto
        balance -= amount;
        break;

      case 'INVERSION':
        inversiones += amount;
        gastos      += amount; // ✅ inversión cuenta como gasto
        balance     -= amount;

        if (f.generated) {
          const generated = Number(f.generated);
          ingresos += generated;
          balance  += generated;
        }
        break;
    }
  }

  return { ingresos, gastos, ahorros, inversiones, balance };
}

  // ============================
// getCharts — AHORRO e INVERSION también van a expenseMap
// ============================
async getCharts(userId: string, filter: string) {

  const { start, end } = this.getDateFilter(filter);

  const finances = await this.financeRepository
    .createQueryBuilder('finance')
    .where('finance.userUuid = :userId', { userId })
    .andWhere('finance.date BETWEEN :start AND :end', {
      start: start.toISOString().split("T")[0],
      end:   end.toISOString().split("T")[0]
    })
    .getMany();

  const incomeMap      = new Map<string, number>();
  const expenseMap     = new Map<string, number>();
  const savingsMap     = new Map<string, number>();
  const investmentsMap = new Map<string, number>();

  for (const f of finances) {

    let date: Date;
    if (filter === "day") {
      date = new Date(f.createdAt);
    } else {
      const [year, month, day] = f.date.split("-").map(Number);
      date = new Date(year, month - 1, day);
    }

    const amount = Number(f.amount);
    let label = "";

    if (filter === "week")  label = date.toLocaleDateString("en-US", { weekday: "short" });
    if (filter === "month") label = date.getDate().toString();
    if (filter === "year")  label = date.toLocaleDateString("en-US", { month: "short" });
    if (filter === "day")   label = date.getHours() + ":00";

    switch (f.financeType) {

      case 'INGRESO':
        incomeMap.set(label, (incomeMap.get(label) || 0) + amount);
        break;

      case 'GASTO':
        expenseMap.set(label, (expenseMap.get(label) || 0) + amount);
        break;

      case 'AHORRO':
        savingsMap.set(label,  (savingsMap.get(label)  || 0) + amount);
        expenseMap.set(label,  (expenseMap.get(label)  || 0) + amount); // ✅
        break;

      case 'INVERSION':
        investmentsMap.set(label, (investmentsMap.get(label) || 0) + amount);
        expenseMap.set(label,     (expenseMap.get(label)     || 0) + amount); // ✅
        break;
    }
  }

  const convert = (map: Map<string, number>) => {
    const labels = this.generateLabels(filter);
    return labels.map(label => ({ label, value: map.get(label) || 0 }));
  };

  return {
    income:      convert(incomeMap),
    expense:     convert(expenseMap),
    savings:     convert(savingsMap),
    investments: convert(investmentsMap),
  };
}
  private getDateFilter(filter: string) {

  const now = new Date();

  if (filter === 'day') {

    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    return { start, end };
  }

  if (filter === 'week') {

    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);

    const start = new Date(now.setDate(diff));
    start.setHours(0,0,0,0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23,59,59,999);

    return { start, end };
  }

  if (filter === 'month') {

    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const end = new Date(now.getFullYear(), now.getMonth()+1, 0);
    end.setHours(23,59,59,999);

    return { start, end };
  }

  // 🔥 AQUI ESTA EL ARREGLO
  if (filter === 'year') {

    const start = new Date(now.getFullYear(), 0, 1);

    const end = new Date(now.getFullYear(), 11, 31);
    end.setHours(23,59,59,999);

    return { start, end };
  }

  return { start: now, end: now };
}
  private generateLabels(filter: string) {

    if (filter === "day") {
      return Array.from({ length: 24 }, (_, i) => `${i}:00`);
    }

    if (filter === "week") {
      return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    }

    if (filter === "month") {

      const days = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      ).getDate();

      return Array.from({ length: days }, (_, i) => (i + 1).toString());
    }

    if (filter === "year") {
      return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    }

    return [];
  }

  // ============================
// getLargeCharts — misma lógica
// ============================
async getLargeCharts(userId: string, filter: string) {

  const { start, end } = this.getDateFilter(filter);

  const finances = await this.financeRepository
    .createQueryBuilder('finance')
    .where('finance.userUuid = :userId', { userId })
    .andWhere('finance.date BETWEEN :start AND :end', {
      start: start.toISOString().split("T")[0],
      end:   end.toISOString().split("T")[0]
    })
    .getMany();

  const incomeMap      = new Map<string, number>();
  const expenseMap     = new Map<string, number>();
  const savingsMap     = new Map<string, number>();
  const investmentsMap = new Map<string, number>();

  for (const f of finances) {

    let date: Date;
    if (filter === "day") {
      date = new Date(f.createdAt);
    } else {
      const [year, month, day] = f.date.split("-").map(Number);
      date = new Date(year, month - 1, day);
    }

    const amount = Number(f.amount);
    let label = "";

    if (filter === "day") {
      const hour = date.getHours();
      if      (hour >= 6  && hour < 12) label = "Mañana";
      else if (hour >= 12 && hour < 19) label = "Tarde";
      else if (hour >= 19 && hour <= 23) label = "Noche";
    }
    if (filter === "week") {
      const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
      label = days[date.getDay()];
    }
    if (filter === "month") label = `Semana${Math.ceil(date.getDate() / 7)}`;
    if (filter === "year") {
      const months = ["Ene","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dic"];
      label = months[date.getMonth()];
    }

    switch (f.financeType) {

      case 'INGRESO':
        incomeMap.set(label, (incomeMap.get(label) || 0) + amount);
        break;

      case 'GASTO':
        expenseMap.set(label, (expenseMap.get(label) || 0) + amount);
        break;

      case 'AHORRO':
        savingsMap.set(label,  (savingsMap.get(label)  || 0) + amount);
        expenseMap.set(label,  (expenseMap.get(label)  || 0) + amount); // ✅
        break;

      case 'INVERSION':
        investmentsMap.set(label, (investmentsMap.get(label) || 0) + amount);
        expenseMap.set(label,     (expenseMap.get(label)     || 0) + amount); // ✅
        break;
    }
  }

  const labels  = this.generateLargeLabels(filter);
  const convert = (map: Map<string, number>) =>
    labels.map(label => ({ label, value: map.get(label) || 0 }));

  return {
    income:      convert(incomeMap),
    expense:     convert(expenseMap),
    savings:     convert(savingsMap),
    investments: convert(investmentsMap),
  };
}

  
  

  private generateLargeLabels(filter: string) {

    if (filter === "day") {
      return ["Mañana","Tarde","Noche"];
    }

    if (filter === "week") {
      return ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
    }

    if (filter === "month") {
      return ["Semana1","Semana2","Semana3","Semana4"];
    }

    if (filter === "year") {
      return ["Ene","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dic"];
    }

    return [];
  }

  async getDonutInsights(userId: string, filter: string) {

    const { start, end } = this.getDateFilter(filter);

    const finances = await this.financeRepository
      .createQueryBuilder('finance')
      .where('finance.userUuid = :userId', { userId })
      .andWhere('finance.date BETWEEN :start AND :end', {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0]
      })
      .getMany();

    let incomeNormalTotal = 0;
    let incomeFixedTotal = 0;
    let expenseNormalTotal = 0;
    let expenseFixedTotal = 0;

    const incomeNormal: any[] = [];
    const incomeFixed: any[] = [];

    const expenseNormal: any[] = [];
    const expenseFixed: any[] = [];

    for (const f of finances) {
      console.log("TYPE:", f.financeType, "NAME:", f.called, "AMOUNT:", f.amount);

      const amount = Number(f.amount);

      if (f.financeType === FinanceType.INGRESO) {
        console.log("👉 INGRESO DETECTADO:", f.called, amount, f.isFromRecurring);
        console.log("FINANCES", finances);

        if (f.isFromRecurring) {

          incomeFixedTotal += amount;

          incomeFixed.push({
            name: f.called,
            value: amount
          });

        } else {

          incomeNormalTotal += amount;

          incomeNormal.push({
            name: f.called,
            value: amount
          });
        }
      }

      if (f.financeType === FinanceType.GASTO) {

        if (f.isFromRecurring) {

          expenseFixedTotal += amount;

          expenseFixed.push({
            name: f.called,
            value: amount
          });

        } else {

          expenseNormalTotal += amount;

          expenseNormal.push({
            name: f.called,
            value: amount
          });
        }
      }
    }

    const sortTop = (arr:any[]) =>
      arr.sort((a,b)=> b.value - a.value).slice(0,3);

    console.log("🔥 incomeNormal:", incomeNormal);
console.log("🔥 incomeFixed:", incomeFixed);

    return {

      income:{
        normalTotal: incomeNormalTotal,
        fixedTotal: incomeFixedTotal,
        normalTop: sortTop(incomeNormal),
        fixedTop: sortTop(incomeFixed)
      },

      expense:{
        normalTotal: expenseNormalTotal,
        fixedTotal: expenseFixedTotal,
        normalTop: sortTop(expenseNormal),
        fixedTop: sortTop(expenseFixed)
      }

    };
  }

  async getTopSavings(userId: string) {

  const savings = await this.savingRepository.find({
    where: {
      user: { uuid: userId },
      isActive: true
    }
  });

  const withProgress = savings.map(s => {

    const totalSaved = Number(s.totalSaved);
    const target = Number(s.targetAmount);

    const progress = target > 0
      ? (totalSaved / target) * 100
      : 0;

    return {
      name: s.name,
      progress: Number(progress.toFixed(2)),
      saved: totalSaved,
      target
    };

  });

  const top3 = withProgress
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  return top3;
}
async getTopInvestments(userId: string) {

  const investments = await this.investmentRepository
    .createQueryBuilder("investment")
    .leftJoinAndSelect("investment.finances","finance")
    .where("investment.userUuid = :userId",{ userId })
    .andWhere("investment.isActive = true")
    .getMany();

  const data = investments.map(inv => {

    const invested = inv.finances?.reduce(
      (sum,f)=> sum + Number(f.amount),
      0
    ) || 0;

    const generated = inv.finances?.reduce(
      (sum,f)=> sum + Number(f.generated || 0),
      0
    ) || 0;

    const relevance = invested + generated;

    return {
      name: inv.name,
      invested,
      generated,
      relevance
    };

  });

  const top3 = data
    .sort((a,b)=> b.relevance - a.relevance)
    .slice(0,3);

  return top3;

}
}