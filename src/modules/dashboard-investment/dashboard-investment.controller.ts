import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardInvestmentService } from './dashboard-investment.service';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum';

@Controller('dashboard-investment')
export class DashboardInvestmentController {

  constructor(
    private readonly dashboardInvestmentService: DashboardInvestmentService,
  ) {}

  // 📊 GRÁFICA INVERTIDO vs GENERADO
  @Get('chart')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getChart(
    @Req() req: any,
    @Query('investmentId') investmentId: string,
    @Query('filter') filter: string,
  ) {
    return this.dashboardInvestmentService.getInvestmentChart(
      req.user.uuid,
      investmentId,
      filter,
    );
  }

  // 📊 RESUMEN GENERAL (totales + porcentaje ganancia)
  @Get('summary')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getSummary(
    @Req() req: any,
    @Query('investmentId') investmentId: string,
    @Query('filter') filter: string,
  ) {
    return this.dashboardInvestmentService.getInvestmentSummary(
      req.user.uuid,
      investmentId,
      filter,
    );
  }

  // 🍩 DONUT PRINCIPAL — Invertido vs Ganancia real
  @Get('donut')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getDonut(
    @Req() req: any,
    @Query('investmentId') investmentId: string,
    @Query('filter') filter: string,
  ) {
    return this.dashboardInvestmentService.getInvestmentDonut(
      req.user.uuid,
      investmentId,
      filter,
    );
  }

  // 🍩 DONUT BREAKDOWN — Generado vs Ganancia real (drilldown al click)
  @Get('donut-breakdown')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getDonutBreakdown(
    @Req() req: any,
    @Query('investmentId') investmentId: string,
    @Query('filter') filter: string,
  ) {
    return this.dashboardInvestmentService.getInvestmentDonutBreakdown(
      req.user.uuid,
      investmentId,
      filter,
    );
  }

  // 📊 BARRA — Invertido vs Generado vs Ganancia
  @Get('bar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getBar(
    @Req() req: any,
    @Query('investmentId') investmentId: string,
    @Query('filter') filter: string,
  ) {
    return this.dashboardInvestmentService.getInvestmentBar(
      req.user.uuid,
      investmentId,
      filter,
    );
  }
}//hola joraca como estais 