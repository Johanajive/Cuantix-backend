import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardUserService } from './dashboard-user.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum';

@Controller('dashboard-users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class DashboardUserController {
  constructor(private readonly dashboardUserService: DashboardUserService) {}

  /** Estadísticas globales de usuarios con filtro temporal */
  @Get('stats')
  getStats(@Query('filter') filter = 'month') {
    return this.dashboardUserService.getStats(filter);
  }

  /** Datos para la gráfica de crecimiento de usuarios */
  @Get('chart-data')
  getChartData(@Query('filter') filter = 'month') {
    return this.dashboardUserService.getChartData(filter);
  }

  /** Distribución de usuarios por género */
  @Get('gender-breakdown')
  getGenderBreakdown() {
    return this.dashboardUserService.getGenderBreakdown();
  }

  /** Últimos usuarios registrados */
  @Get('recent-users')
  getRecentUsers(@Query('limit') limit = 10) {
    return this.dashboardUserService.getRecentUsers(Number(limit));
  }

  /** Tendencia de suscripciones */
  @Get('subscription-trend')
  getSubscriptionTrend(@Query('filter') filter = 'month') {
    return this.dashboardUserService.getSubscriptionTrend(filter);
  }
}