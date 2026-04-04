import { Controller, Get, Query } from "@nestjs/common";
import { DashboardAgentService } from "./dashboard-agent.service";

@Controller("dashboard-agent")
export class DashboardAgentController {
  constructor(private readonly dashboardService: DashboardAgentService) {}

  @Get()
  getDashboard(
    @Query("userUuid") userUuid: string,
    @Query("filter") filter: string
  ) {
    return this.dashboardService.getStats(userUuid, filter);
  }

  @Get("chart-data")
  getChartData(
    @Query("userUuid") userUuid: string,
    @Query("filter") filter: string
  ) {
    return this.dashboardService.getChartData(userUuid, filter);
  }

  @Get("/top-agents")
  getTopAgents() {
    return this.dashboardService.getTopAgents();
  }
}