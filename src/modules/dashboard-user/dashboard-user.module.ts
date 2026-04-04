import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardUserController } from './dashboard-user.controller';
import { DashboardUserService } from './dashboard-user.service';
import { Users } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  controllers: [DashboardUserController],
  providers: [DashboardUserService],
})
export class DashboardUserModule {}