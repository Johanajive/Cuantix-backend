import { Module } from '@nestjs/common';
import { DasboardVsService } from './dasboard-vs.service';
import { DasboardVsController } from './dasboard-vs.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Finance } from '../../entities/finance.entity';
import { Investment } from '../../entities/Investment.entity';
import { Saving } from '../../entities/Saving.entity';
import { RecurringFinance } from '../../entities/recurringFinance.entity';

@Module({
   imports: [
      TypeOrmModule.forFeature([Finance, Investment, Saving, RecurringFinance]),
    ],
  controllers: [DasboardVsController],
  providers: [DasboardVsService],
})
export class DasboardVsModule {}