import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { DasboardVsService } from './dasboard-vs.service';

import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum';

@Controller('dashboard-vs')
export class DasboardVsController {

  constructor(
    private readonly dashboardVsService: DasboardVsService
  ) {}

  // 📊 RESUMEN GENERAL VS
  @Get('summary')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getSummary(
    @Req() req: any,
    @Query('filter') filter: string
  ) {

    return this.dashboardVsService.getVsSummary(
      req.user.uuid,
      filter
    );

  }


  // 📊 GRAFICA INGRESOS VS GASTOS
  @Get('chart')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getChart(
    @Req() req: any,
    @Query('filter') filter: string
  ) {

    return this.dashboardVsService.getVsChart(
      req.user.uuid,
      filter
    );

  }


  // 🍩 DONUT INGRESOS VS GASTOS
  @Get('donut')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getDonut(
    @Req() req: any,
    @Query('filter') filter: string
  ) {

    return this.dashboardVsService.getVsDonut(
      req.user.uuid,
      filter
    );

  }

  @Get('breakdown')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM)
getBreakdown(
  @Req() req: any,
  @Query('filter') filter: string,
  @Query('type') type: string
) {

  return this.dashboardVsService.getVsBreakdown(
    req.user.uuid,
    filter,
    type
  );

}

@Get('chart-breakdown')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
getChartBreakdown(
  @Req() req:any,
  @Query('filter') filter:string,
  @Query('type') type:string
){
  return this.dashboardVsService.getVsBreakdownLarge(
    req.user.uuid,
    filter,
    type
  )
}


@Get('donut-breakdown')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
getDonutBreakdown(
  @Req() req:any,
  @Query('filter') filter:string,
){
  return this.dashboardVsService.getExpensesVsIncomes(
    req.user.uuid,
    filter,
  )
}

}