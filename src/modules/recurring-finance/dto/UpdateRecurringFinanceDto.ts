import { PartialType } from '@nestjs/mapped-types';
import { CreateRecurringFinanceDto } from './CreateRecurringFinanceDto';

export class UpdateRecurringFinanceDto extends PartialType(CreateRecurringFinanceDto) {}