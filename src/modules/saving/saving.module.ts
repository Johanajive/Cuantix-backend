import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Saving } from '../../entities/Saving.entity';
import { Finance } from '../../entities/finance.entity';
import { SavingService } from './saving.service';
import { SavingController } from './saving.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Saving, Finance])],
  controllers: [SavingController],
  providers: [SavingService],
})
export class SavingModule {}