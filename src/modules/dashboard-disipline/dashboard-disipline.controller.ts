import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum';
import { DashboardDisiplineService } from './dashboard-disipline.service';

@Controller('discipline')
export class DashboardDisiplineController {
  constructor(private readonly disciplineService: DashboardDisiplineService) {}

  // Resumen: totales de adelantados, exactos y atrasados
  @Get('summary')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  async getSummary(@Req() req: any, @Query('filter') filter: string) {
    const data = await this.disciplineService.getDisciplineSummary(
      req.user.uuid,
      filter || 'month',
    );
    return { data };
  }

  // Datos para la gráfica de barras agrupadas
  @Get('chart')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  async getChart(@Req() req: any, @Query('filter') filter: string) {
    const data = await this.disciplineService.getDisciplineChart(
      req.user.uuid,
      filter || 'month',
    );
    return { data };
  }

  // Datos para la gráfica de dona
  @Get('donut')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  async getDonut(@Req() req: any, @Query('filter') filter: string) {
    const data = await this.disciplineService.getDisciplineDonut(
      req.user.uuid,
      filter || 'month',
    );
    return { data };
  }
}