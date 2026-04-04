import { Module } from '@nestjs/common';
import { InventmentService } from './inventment.service';
import { InventmentController } from './inventment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Investment } from '../../entities/Investment.entity';
import { Users } from '../../entities/user.entity';
import { Finance } from '../../entities/finance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Investment, Finance, Users])],
  controllers: [InventmentController],
  providers: [InventmentService],
})
export class InventmentModule {}