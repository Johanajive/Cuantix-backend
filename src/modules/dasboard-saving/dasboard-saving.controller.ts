import { Controller, Get, Param, Req, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DasboardSavingService } from './dasboard-saving.service';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum';

@Controller('saving-progress')
@UseGuards(AuthGuard('jwt'))
export class DasboardSavingController {

  constructor(
    private readonly savingProgressService: DasboardSavingService
  ) {}

  // 📊 DONA
  @Get('donut/:uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getDonut(
    @Req() req: any,
    @Param('uuid') uuid: string,
    @Query('filter') filter: string,
  ) {
    return this.savingProgressService.getSavingDonut(req.user.uuid, uuid, filter);
  }

  // 📊 OVERVIEW (ahora acepta ?filter=)
  @Get('overview/:uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getSavingOverview(
    @Param('uuid') uuid: string,
    @Req() req: any,
    @Query('filter') filter: string,
  ) {
    return this.savingProgressService.getSavingOverview(req.user.uuid, uuid, filter ?? 'total');
  }

  // 📊 PROGRESO — va de ÚLTIMO porque ':uuid' es comodín
  @Get(':uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getProgress(
    @Req() req: any,
    @Param('uuid') uuid: string,
    @Query('filter') filter: string,
  ) {
    return this.savingProgressService.getProgress(req.user.uuid, uuid, filter);
  }
}