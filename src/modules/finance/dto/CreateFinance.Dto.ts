import {
  IsString,
  IsNotEmpty,
  Length,
  IsEnum,
  IsNumber,
  IsPositive,
  Matches,
} from 'class-validator';
import { FinanceType } from '../../../enums/financeType.enum'; 

export class CreateFinanceDto {
  @IsString({ message: 'El nombre del bolsillo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del bolsillo no puede estar vacío' })
  @Length(3, 100, {
    message: 'El nombre del bolsillo debe tener entre 3 y 100 caracteres',
  })
  called: string;

  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsNotEmpty({ message: 'El monto no puede estar vacío' })
  @IsPositive({ message: 'El monto debe ser mayor a cero' })
  amount: number;

  @IsNotEmpty({ message: 'La fecha no puede estar vacía' })
  @Matches(/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, {
    message: 'La fecha debe tener el formato yyyy-mm-dd',
  })
  date: string;

  @IsEnum(FinanceType, {
    message: 'El tipo de finanza debe ser GASTO, AHORRO o INVERSION',
  })
  financeType: FinanceType;
}