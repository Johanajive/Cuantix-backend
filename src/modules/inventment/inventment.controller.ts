import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Req,  
  UseGuards,
  
} from '@nestjs/common';
import { Delete } from '@nestjs/common';
import { InventmentService } from './inventment.service';
import { CreateInvestmentDto } from './dto/CreateInvestmentDto';
import { AddInvestmentAmountDto } from './dto/AddInvestmentAmountDto';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum';
import { AuthGuard } from '@nestjs/passport';
import {Frequency} from  '../../enums/frequency.enum';

@Controller('investments')
@UseGuards(AuthGuard('jwt'))
export class InventmentController {
  constructor(private readonly investmentService: InventmentService) {}

  // ====================================
  // CREAR INVERSIÓN
  // POST /investments
  // ====================================
  @Post()
  async create(
    @Body() createDto: CreateInvestmentDto,
    @Req() req,
  ) {
    const userId = req.user.uuid;

    return this.investmentService.create(createDto, userId);
  }

  // ====================================
  // MARCAR COMO PAGADA
  // PATCH /investments/:uuid/pay
  // ====================================
@Patch(':id/pay')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
markAsPaid(
  @Param('id') id: string,
  @Body() dto: AddInvestmentAmountDto,
  @Req() req: any,
) {
  return this.investmentService.markAsPaid(
    id,
    dto,
    req.user.uuid, // 👈 igual que tu createFinance
  );
}
  // ====================================
  // LISTAR INVERSIONES DEL USUARIO
  // GET /investments
  // ====================================
  @Get()
  async findAll(@Req() req) {
    const userId = req.user.uuid;

    return this.investmentService.findAllByUser(userId);
  }

  @Patch(':uuid/frequency')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
updateFrequency(
  @Param('uuid') uuid: string,
  @Body() body: { frequency: Frequency },
  @Req() req: any,
) {
  return this.investmentService.updateFrequency(
    uuid,
    body.frequency,
    req.user.uuid,
  );
}

// ====================================
// ELIMINAR INVERSION
// DELETE /investments/:uuid
// ====================================
@Delete(':uuid')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
deleteInvestment(
  @Param('uuid') uuid: string,
  @Req() req: any,
) {
  return this.investmentService.deleteInvestment(
    uuid,
    req.user.uuid,
  );
}

}