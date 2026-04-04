import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SchedulerService } from './scheduler.service';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) { }

  // 🔥 SOLO PARA PRUEBAS — dispara el cron manualmente ahora mismo
  // Llamar: POST /scheduler/trigger-now
  // scheduler.controller.ts
  @Post('trigger-now')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)  // ← solo admin
  async triggerNow() {
    await this.schedulerService.handleDailyNotifications();
    return { message: ' Notificaciones procesadas manualmente' };
  }
}