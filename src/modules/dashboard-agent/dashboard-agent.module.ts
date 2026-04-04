import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardAgentService } from './dashboard-agent.service'; 
import { DashboardAgentController } from './dashboard-agent.controller'; 

import { AdvisoryRequest } from '../../entities/advisoryRequest.entity';
import { Session } from '../../entities/session.entity';
import { Users } from '../../entities/user.entity';
import { Agent } from '../../entities/agent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdvisoryRequest,
      Session,
      Users,
      Agent
    ]),
  ],
  controllers: [DashboardAgentController],
  providers: [DashboardAgentService],
})
export class DashboardAgentModule {}