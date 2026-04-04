import { Module } from '@nestjs/common';
import { DasboardSavingService } from './dasboard-saving.service';
import { DasboardSavingController } from './dasboard-saving.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Saving} from '../../entities/Saving.entity';
import {Finance} from '../../entities/finance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Saving, Finance]) // 🔥 ESTA ES LA CLAVE
  ],
  controllers: [DasboardSavingController],
  providers: [DasboardSavingService],
})
export class DasboardSavingModule {}