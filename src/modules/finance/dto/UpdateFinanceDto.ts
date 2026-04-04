import {
    IsString,
    IsOptional,
    Length,
    IsEnum,
    IsNumber,
    IsPositive,
    Matches,
    IsUUID,
    
} from 'class-validator';
import { FinanceType } from '../../../enums/financeType.enum';
import { Type } from 'class-transformer';


export class UpdateFinanceDto {

    @IsOptional()
    @IsString({ message: 'El nombre del bolsillo debe ser una cadena de texto' })
    @Length(3, 100, {
        message: 'El nombre del bolsillo debe tener entre 3 y 100 caracteres',
    })
    called?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El monto debe ser un número válido' })
    amount?: number;

    @IsOptional()
    @Matches(/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, {
        message: 'La fecha debe tener el formato yyyy-mm-dd',
    })
    date?: string;

    @IsOptional()
    @IsEnum(FinanceType, {
        message: 'El tipo de finanza debe ser GASTO, AHORRO o INVERSION',
    })
    financeType?: FinanceType;

    @IsOptional()
    @IsUUID('4', { message: 'El id del usuario debe ser un UUID válido' })
    user?: string;
}