import { IsNumber } from 'class-validator';

export class AddInvestmentAmountDto {

  @IsNumber()
  amount: number;

  @IsNumber()
  generated?: number; // opcional si quiere registrar ganancia
}