import { Module } from '@nestjs/common';
import { DashboardInvestmentService } from './dashboard-investment.service';
import { DashboardInvestmentController } from './dashboard-investment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Finance} from '../../entities/finance.entity';
import {Investment} from '../../entities/Investment.entity';


@Module({
   imports: [
      TypeOrmModule.forFeature([Investment, Finance]) 
    ],
  controllers: [DashboardInvestmentController],
  providers: [DashboardInvestmentService],
})
export class DashboardInvestmentModule {}