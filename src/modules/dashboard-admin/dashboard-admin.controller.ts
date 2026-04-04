import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardAdminService } from './dashboard-admin.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum';

@Controller('dashboard-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class DashboardAdminController {
  constructor(private readonly dashboardService: DashboardAdminService) {}

  /** Estadísticas globales con filtro temporal */
  @Get('stats')
  getStats(@Query('filter') filter = 'month') {
    return this.dashboardService.getStats(filter);
  }

  /** Datos para la gráfica de línea (sesiones + nuevos usuarios) */
  @Get('chart-data')
  getChartData(@Query('filter') filter = 'month') {
    return this.dashboardService.getChartData(filter);
  }

  /** Top agentes por sesiones completadas */
  @Get('top-agents')
  getTopAgents(@Query('filter') filter = 'month') {
    return this.dashboardService.getTopAgents(filter);
  }

  /** Distribución de agentes por especialidad */
  @Get('specialty-breakdown')
  getSpecialtyBreakdown() {
    return this.dashboardService.getAgentsBySpecialty();
  }
}