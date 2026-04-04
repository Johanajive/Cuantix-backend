import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardAdminController } from './dashboard-admin.controller';
import { DashboardAdminService } from './dashboard-admin.service';
import { Users } from '../../entities/user.entity';
import { Agent } from '../../entities/agent.entity';
import { Session } from '../../entities/session.entity';
import { AdvisoryRequest } from '../../entities/advisoryRequest.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Agent, Session, AdvisoryRequest]),
  ],
  controllers: [DashboardAdminController],
  providers: [DashboardAdminService],
})
export class DashboardAdminModule {}