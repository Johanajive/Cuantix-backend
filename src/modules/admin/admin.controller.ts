import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum'; 
import { RolesGuard } from '../auth/role.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('agents/approved')
  async getApprovedAgents() {
    return this.adminService.getApprovedAgents();
  }

  //Ver asesores pendientes
  @Get('agents/pending')
  async getPendingAgents() {
    return this.adminService.getPendingAgents();
  }

  //Aprobar asesor
  @Patch('agents/:uuid/approve')
  async approveAgent(@Param('uuid') uuid: string) {
    return this.adminService.approveAgent(uuid);
  }

  @Delete('delete-agent/:uuid')
  deleteAgent(@Param('uuid') uuid: string) {
    return this.adminService.deleteAgent(uuid);
  }

  @Get('dashboard/stats')
  async getStats() {
    return this.adminService.getDashboardStats();
  }
}