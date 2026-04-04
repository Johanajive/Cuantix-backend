import {
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';

import { Type } from 'class-transformer';
import { Frequency } from '../../../enums/frequency.enum';

export class CreateSavingDto {

  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  targetAmount: number;

  @Type(() => Number)
  @IsNumber()
  budget: number;

  @IsDateString()
  startDate: string;

  @IsEnum(Frequency)
  frequency: Frequency;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}