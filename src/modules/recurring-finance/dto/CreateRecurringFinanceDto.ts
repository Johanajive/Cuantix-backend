import { IsEnum, IsNotEmpty, IsNumber, IsDateString, IsString, MaxLength } from 'class-validator';
import { FinanceType } from '../../..//enums/financeType.enum';
import { Frequency } from '../../..//enums/frequency.enum';
import { Type } from 'class-transformer';

export class CreateRecurringFinanceDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsEnum(FinanceType)
  financeType: FinanceType;

  @IsEnum(Frequency)
  frequency: Frequency;

  @IsDateString()
  nextDueDate: string;
}