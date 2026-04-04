import { Module } from '@nestjs/common';
import { RecurringFinanceService } from './recurring-finance.service';
import { RecurringFinanceController } from './recurring-finance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Finance } from '../../entities/finance.entity';
import { Users } from '../../entities/user.entity';
import { RecurringFinance } from '../../entities/recurringFinance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Finance, Users, RecurringFinance])],
  controllers: [RecurringFinanceController],
  providers: [RecurringFinanceService],
})
export class RecurringFinanceModule {}