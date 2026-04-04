import { Controller, Get, Param, Query } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('public-agent')
export class PublicAgentController {
  constructor(private readonly agentService: AgentService) { }

  @Get()
  getAllAgents() {
    return this.agentService.getAllPublicAgents();
  }

  @Get(':agentUuid/profile')
  getPublicProfile(@Param('agentUuid') agentUuid: string) {
    return this.agentService.getAgentPublicProfile(agentUuid);
  }

  @Get(':agentUuid/slots')
  getAvailableSlots(
    @Param('agentUuid') agentUuid: string,
    @Query('date') date: string,
  ) {
    return this.agentService.getAvailableSlots(agentUuid, date);
  }

  @Get(':agentUuid/reviews')
  getReviews(@Param('agentUuid') agentUuid: string) {
    return this.agentService.getAgentReviews(agentUuid);
  }

  @Get(':agentUuid/user-session/:userId')
  getUserActiveSession(
    @Param('agentUuid') agentUuid: string,
    @Param('userId') userId: string,
  ) {
    return this.agentService.getUserActiveSession(userId, agentUuid);
  }
}