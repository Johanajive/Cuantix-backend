import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { Frequency } from '../../../enums/frequency.enum';

export class CreateInvestmentDto {

  @IsString()
  name: string;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  nextDueDate: Date;

  @IsEnum(Frequency)
  frequency: Frequency;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}