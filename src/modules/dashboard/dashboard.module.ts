import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Finance } from '../../entities/finance.entity';
import { Investment } from '../../entities/Investment.entity';
import { Saving } from '../../entities/Saving.entity';
import {RecurringFinance} from '../../entities/recurringFinance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Finance, Investment, Saving, RecurringFinance]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}