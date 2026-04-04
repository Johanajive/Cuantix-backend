import { Module } from '@nestjs/common';
import { DashboardDisiplineService } from './dashboard-disipline.service';
import { DashboardDisiplineController } from './dashboard-disipline.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { RecurringFinance } from '../../entities/recurringFinance.entity';
import { Finance } from '../../entities/finance.entity';


@Module({
  imports: [
      TypeOrmModule.forFeature([RecurringFinance, Finance]) // 🔥 ESTA ES LA CLAVE
    ],
  controllers: [DashboardDisiplineController],
  providers: [DashboardDisiplineService],
})
export class DashboardDisiplineModule {}
