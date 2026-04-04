import { IsNumber } from 'class-validator';

export class AddSavingAmountDto {
  @IsNumber()
  amount: number;
}