import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {

  constructor(
    private readonly dashboardService: DashboardService
  ) {}

  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  async getDashboard(
    @Req() req: any,
    @Query('filter') filter: string,
  ) {

    const summary = await this.dashboardService.getSummary(req.user.uuid, filter);

    const charts = await this.dashboardService.getCharts(req.user.uuid, filter);

    return {
      ...summary,
      charts
    };

  }

   @UseGuards(AuthGuard('jwt'))
  @Get('charts-large')
  async getLargeCharts(
    @Req() req,
    @Query('filter') filter: string = 'month'
  ) {

    const userId = req.user.uuid;

    return this.dashboardService.getLargeCharts(userId, filter);
  }

@Get('donut-insights')
@UseGuards(AuthGuard('jwt'))
async getDonutInsights(
  @Req() req,
  @Query('filter') filter: string = 'month'
) {

  return this.dashboardService.getDonutInsights(
    req.user.uuid,
    filter
  );

}

@Get('top-savings')
@UseGuards(AuthGuard('jwt'))
async getTopSavings(
  @Req() req
) {
  return this.dashboardService.getTopSavings(
    req.user.uuid
  );
}

@Get('top-investments')
@UseGuards(AuthGuard('jwt'))
async getTopInvestments(
  @Req() req
){
  return this.dashboardService.getTopInvestments(
    req.user.uuid
  );
}
}