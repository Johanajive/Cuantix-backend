import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentController } from './agent.controller';
import { PublicAgentController } from './public-agent.controller';
import { AgentService } from './agent.service';
import { Agent } from '../../entities/agent.entity'; 
import { Users } from '../../entities/user.entity';
import { AdvisoryRequest } from '../../entities/advisoryRequest.entity';
import { Session } from '../../entities/session.entity'; 
import { Review } from '../../entities/review.entity'; 
import { CaseDocument } from '../../entities/caseDocument.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      Users,
      AdvisoryRequest,
      Session,
      Review,
      CaseDocument,
    ]),
  ],
  controllers: [AgentController, PublicAgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule { }