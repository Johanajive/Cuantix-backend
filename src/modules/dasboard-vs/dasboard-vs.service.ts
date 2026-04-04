import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm/repository/Repository.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Finance } from '../../entities/finance.entity';

@Injectable()
export class DasboardVsService {

     constructor(
    @InjectRepository(Finance)
    private readonly financeRepository: Repository<Finance>,
  ) {}

   async getVsSummary(userId: string, filter: string) {

    const { start, end } = this.getDateFilter(filter);

    const finances = await this.financeRepository
      .createQueryBuilder('finance')
      .where('finance.userUuid = :userId', { userId })
      .andWhere('finance.date BETWEEN :start AND :end', {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0]
      })
      .getMany();

    let income = 0;
    let expense = 0;
    let savings = 0;
    let investments = 0;
    let generated = 0;

    for (const f of finances) {

      const amount = Number(f.amount);

      switch (f.financeType) {

        case 'INGRESO':
          income += amount;
          break;

        case 'GASTO':
          expense += amount;
          break;

        case 'AHORRO':
          savings += amount;
          expense += amount;
          break;

        case 'INVERSION':
          investments += amount;
          expense += amount;

          if (f.generated) {

            const gen = Number(f.generated);
            generated += gen;
            income += gen;

          }
          break;

      }

    }

    const balance = income - expense;

    return {
      income,
      expense,
      savings,
      investments,
      generated,
      balance
    };
  }

  async getVsChart(userId: string, filter: string) {

  const { start, end } = this.getDateFilter(filter);

  const finances = await this.financeRepository
    .createQueryBuilder('finance')
    .where('finance.userUuid = :userId', { userId })
    .andWhere('finance.date BETWEEN :start AND :end', {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0]
    })
    .getMany();

  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();

  for (const f of finances) {

    let date: Date;

    if (filter === "day") {
      date = new Date(f.createdAt);
    } else {
      const [y, m, d] = f.date.split("-").map(Number);
      date = new Date(y, m - 1, d);
    }

    let label = "";

    // DAY
    if (filter === "day") {

      const hour = date.getHours();

      if (hour >= 6 && hour < 12) label = "Mañana";
      else if (hour >= 12 && hour < 19) label = "Tarde";
      else label = "Noche";

    }

    // WEEK
    if (filter === "week") {

      const days = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado"
      ];

      label = days[date.getDay()];
    }

    // MONTH
    if (filter === "month") {

      label = `Semana${Math.ceil(date.getDate() / 7)}`;

    }

    // YEAR
    if (filter === "year") {

      const months = [
        "Ene","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dic"
      ];

      label = months[date.getMonth()];
    }

    const amount = Number(f.amount);

    switch (f.financeType) {

      case 'INGRESO':
        incomeMap.set(label, (incomeMap.get(label) || 0) + amount);
        break;

      case 'GASTO':
      case 'AHORRO':
      case 'INVERSION':
        expenseMap.set(label, (expenseMap.get(label) || 0) + amount);
        break;

    }

    if (f.financeType === 'INVERSION' && f.generated) {

      const gen = Number(f.generated);

      incomeMap.set(label, (incomeMap.get(label) || 0) + gen);

    }

  }

  const labels = this.generateLabels(filter);

  const convert = (map: Map<string, number>) =>
    labels.map(label => ({
      label,
      value: map.get(label) || 0
    }));

  return {
    income: convert(incomeMap),
    expense: convert(expenseMap)
  };

}

  async getVsDonut(userId: string, filter: string) {

    const data = await this.getVsSummary(userId, filter);

    return [
      { name:"Ingresos", value:data.income },
      { name:"Gastos", value:data.expense }
    ];

  }

  private getDateFilter(filter: string) {

    const now = new Date();

    if (filter === 'day') {

      const start = new Date();
      start.setHours(0,0,0,0);

      const end = new Date();
      end.setHours(23,59,59,999);

      return { start,end };
    }

    if (filter === 'week') {

      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);

      const start = new Date(now.setDate(diff));
      start.setHours(0,0,0,0);

      const end = new Date(start);
      end.setDate(start.getDate()+6);
      end.setHours(23,59,59,999);

      return { start,end };

    }

    if (filter === 'month') {

      const start = new Date(now.getFullYear(),now.getMonth(),1);
      const end = new Date(now.getFullYear(),now.getMonth()+1,0);
      end.setHours(23,59,59,999);

      return { start,end };

    }

    if (filter === 'year') {

      const start = new Date(now.getFullYear(),0,1);
      const end = new Date(now.getFullYear(),11,31);
      end.setHours(23,59,59,999);

      return { start,end };

    }

    return { start:now,end:now };

  }

  private generateLabels(filter:string){

  if(filter==="day"){
    return ["Mañana","Tarde","Noche"]
  }

  if(filter==="week"){
    return ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]
  }

  if(filter==="month"){
    return ["Semana1","Semana2","Semana3","Semana4"]
  }

  if(filter==="year"){
    return ["Ene","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dic"]
  }

  return []

}

async getVsBreakdown(userId: string, filter: string, type: string) {

  const data = await this.getVsSummary(userId, filter);

  if (type === "income") {

    return [
      {
        name: "Ingresos",
        value: data.income - data.generated
      },
      {
        name: "Inversiones",
        value: data.generated
      }
    ];

  }

  if (type === "expense") {

    return [
      {
        name: "Gastos",
        value: data.expense - data.savings - data.investments
      },
      {
        name: "Ahorros",
        value: data.savings
      },
      {
        name: "Inversiones",
        value: data.investments
      }
    ];

  }

  return [];

}

async getVsChartBreakdown(userId: string, filter: string, type: string) {

  const { start, end } = this.getDateFilter(filter);

  const finances = await this.financeRepository
    .createQueryBuilder('finance')
    .where('finance.userUuid = :userId', { userId })
    .andWhere('finance.date BETWEEN :start AND :end', {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0]
    })
    .getMany();

  const maps:any = {
    ingreso: new Map(),
    gasto: new Map(),
    ahorro: new Map(),
    inversion: new Map()
  };

  for (const f of finances) {

    let date: Date;

    if (filter === "day") {
      date = new Date(f.createdAt);
    } else {
      const [y,m,d] = f.date.split("-").map(Number);
      date = new Date(y, m-1, d);
    }

    let label = "";

    if (filter === "day") {
      const h = date.getHours();
      if (h >= 6 && h < 12) label = "Mañana";
      else if (h >= 12 && h < 19) label = "Tarde";
      else label = "Noche";
    }

    if (filter === "week") {
      const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
      label = days[date.getDay()];
    }

    if (filter === "month") {
      label = `Semana${Math.ceil(date.getDate()/7)}`;
    }

    if (filter === "year") {
      const months = ["Ene","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dic"];
      label = months[date.getMonth()];
    }

    const amount = Number(f.amount);

    if (f.financeType === "INGRESO")
      maps.ingreso.set(label,(maps.ingreso.get(label)||0)+amount);

    if (f.financeType === "GASTO")
      maps.gasto.set(label,(maps.gasto.get(label)||0)+amount);

    if (f.financeType === "AHORRO")
      maps.ahorro.set(label,(maps.ahorro.get(label)||0)+amount);

    if (f.financeType === "INVERSION")
      maps.inversion.set(label,(maps.inversion.get(label)||0)+amount);

  }

  const labels = this.generateLabels(filter);

  const convert = (map:Map<string,number>) =>
    labels.map(l=>({label:l,value:map.get(l)||0}));

  if(type==="expense"){

    return {
      gasto:convert(maps.gasto),
      ahorro:convert(maps.ahorro),
      inversion:convert(maps.inversion)
    }

  }

  if(type==="income"){

    return {
      ingreso:convert(maps.ingreso),
      inversion:convert(maps.inversion)
    }

  }

}

async getVsBreakdownLarge(userId: string, filter: string, type: string) {

  const { start, end } = this.getDateFilter(filter);

  const finances = await this.financeRepository
    .createQueryBuilder('finance')
    .where('finance.userUuid = :userId', { userId })
    .andWhere('finance.date BETWEEN :start AND :end', {
      start: start.toISOString().split("T")[0], //convertor de fecha, Aquí pasan la fecha a formato YYYY-MM-DD., y .split("T")[0]  lo dividimos en dos partes y despues con la posicion [0] nosquedamos solo la fecha, sin la hora.
      end: end.toISOString().split("T")[0]
    })
    .getMany();

  const gastoMap = new Map<string, number>();
  const ahorroMap = new Map<string, number>();
  const inversionMap = new Map<string, number>();
  const ingresoMap = new Map<string, number>();

  for (const f of finances) {

    const [y,m,d] = f.date.split("-").map(Number);
    const date = new Date(y,m-1,d);

    let label="";

    if (filter === "day") {
      const h = date.getHours();
      if (h >= 6 && h < 12) label = "Mañana";
      else if (h >= 12 && h < 19) label = "Tarde";
      else label = "Noche";
    }

    if(filter==="month"){
      label=`Semana${Math.ceil(date.getDate()/7)}`
    }

    if(filter==="week"){
      const days=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
      label=days[date.getDay()]
    }

    if(filter==="year"){
      const months=["Ene","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dic"]
      label=months[date.getMonth()]
    }

    const amount=Number(f.amount)

    if(f.financeType==="GASTO"){
      gastoMap.set(label,(gastoMap.get(label)||0)+amount)
    }

    if(f.financeType==="AHORRO"){
      ahorroMap.set(label,(ahorroMap.get(label)||0)+amount)
    }

    if(f.financeType==="INVERSION"){
      inversionMap.set(label,(inversionMap.get(label)||0)+amount)

      if(f.generated){
        ingresoMap.set(label,(ingresoMap.get(label)||0)+Number(f.generated))
      }
    }

    if(f.financeType==="INGRESO"){
      ingresoMap.set(label,(ingresoMap.get(label)||0)+amount)
    }

  }

  const labels = this.generateLabels(filter)

  const convert = (map:Map<string,number>) =>
    labels.map(label=>({//importante el metodo map l que hace es recorrer cada uno de los elementos del array y modificarlo segun lo que le indiquemos, y devolver un nuevo array con los elementos modificados, en este caso lo que hacemos es usar una funcion que nos devolvera un objeto con dos propiedades, label y value, donde label es el nombre de la etiqueta y value es el valor correspondiente a esa etiqueta, y para obtener el valor correspondiente a esa etiqueta usamos el metodo get del map, que nos devuelve el valor asociado a esa clave, y si no existe esa clave en el map, le decimos que nos devuelva 0, usando el operador || que significa "o" en este caso, entonces si map.get(label) devuelve un valor falsy (como undefined), entonces se usara 0 como valor por defecto.
      label: label,
      value: map.get(label) || 0
    }))

  if(type==="expense"){

    const gasto = convert(gastoMap)
    const ahorro = convert(ahorroMap)
    const inversion = convert(inversionMap)
    console.log("Gasto:",gasto)
    console.log("Ahorro:",ahorro)
    console.log("Inversion:",inversion)

    return {
      gasto: convert(gastoMap),
      ahorro: convert(ahorroMap),
      inversion: convert(inversionMap)
    }

  }

  if(type==="income"){
    const ingreso = convert(ingresoMap)
    const inversion = convert(inversionMap)
    console.log("Ingreso:",ingreso)
    console.log("Inversion:",inversion)
    
    return {
      ingreso: convert(ingresoMap),
      inversion: convert(inversionMap)
    }
  }

}

async getExpensesVsIncomes(userId: string, filter: string) {

  const { start, end } = this.getDateFilter(filter);//esto se llama destructuracion de un objeto en ingles object destructuring ya que o que nos devuelve el metodo getDateFilter es un objeto con dos propiedades, start y end, entonces lo que hacemos es crear dos variables, start y end, y asignarles el valor de las propiedades start y end del objeto que nos devuelve el metodo getDateFilter, esto es una forma mas sencilla de acceder a esas propiedades sin tener que escribir algo como const dateFilter = this.getDateFilter(filter); const start = dateFilter.start; const end = dateFilter.end;
  
  const raw = await this.financeRepository
  .createQueryBuilder("finance")
  .select("finance.financeType", "type")
  .addSelect("SUM(finance.amount)", "total")
  .addSelect("SUM(finance.generated)", "generated")
  .where("finance.userUuid = :userId", { userId })
  .andWhere("finance.date BETWEEN :start AND :end", {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0]
  })
  .groupBy("finance.financeType")
  .getRawMany()

const summary = raw.reduce((acc:any, item:any) => {
  acc[item.type] = {
    total: Number(item.total),
    generated: Number(item.generated)
  }
  //aca ponemos [] por que es dinamica nevcesitamos acceder a la propiedad del objeto acc que se llama igual que el valor de item.type, entonces si item.type es "INGRESO" entonces acc["INGRESO"] = Number(item.total), y si item.type es "GASTO" entonces acc["GASTO"] = Number(item.total), y asi sucesivamente, esto nos permite crear un objeto summary con las propiedades ingreso, gasto, ahorro e inversion, y asignarles el valor total correspondiente a cada tipo de finanza.
  return acc 
}, {})

const income = (summary.INGRESO?.total || 0) + (summary.INVERSION?.generated || 0)
const expense = ((summary.GASTO?.total || 0) + (summary.AHORRO?.total || 0) + (summary.INVERSION?.total || 0))


console.log("Summary:",summary)
return {
  income,
  expense,
  balance: income - expense
}
    
}



}