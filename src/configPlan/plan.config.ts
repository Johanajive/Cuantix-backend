import { PlanType } from "../enums/planType.enum"; 

interface PlanConfigItem {
    title: string;
    price: number;
}

export const PLAN_CONFIG: Record<PlanType, PlanConfigItem> = {
    [PlanType.PLANMES]: {//Eso se llama: computed property name, (en español: clave calculada)
        title: 'Cuantix Premium Mensual',
        price: 50000,
    },
    [PlanType.PLANAÑO]: {
        title: 'Cuantix Premium Anual',
        price: 5000000
    }
};