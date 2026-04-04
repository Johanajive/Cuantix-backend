import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Finance } from '../../entities/finance.entity';
import { Users } from '../../entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Finance, Users])],
    controllers: [FinanceController],
    providers: [FinanceService],
})
export class FinanceModule {}