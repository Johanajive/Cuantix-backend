import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notification.service';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getMyNotifications(@Req() req: any) {
    return this.notificationsService.getByUser(req.user.uuid);
  }

  @Get('unread')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  countUnread(@Req() req: any) {
    return this.notificationsService.countUnread(req.user.uuid);
  }

  // ⚠️ read-all ANTES de :uuid
  @Patch('read-all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.uuid);
  }

  // 🔥 Checkbox → descartar para siempre (isRead=true + isActive=false)
  @Patch(':uuid/dismiss')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  dismiss(@Param('uuid') uuid: string, @Req() req: any) {
    return this.notificationsService.dismiss(uuid, req.user.uuid);
  }

  // Solo marcar leída visualmente
  @Patch(':uuid/read')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  markAsRead(@Param('uuid') uuid: string, @Req() req: any) {
    return this.notificationsService.markAsRead(uuid, req.user.uuid);
  }
}