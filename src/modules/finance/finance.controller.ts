import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinanceService } from './finance.service';
import { CreateFinanceDto } from './dto/CreateFinance.Dto';
import { UpdateFinanceDto } from './dto/UpdateFinanceDto';
import { RolesGuard } from '../auth/role.guard';
import {Roles} from '../auth/role.decorator';
import { RoleEnum } from '../../enums/role.enum';
import { Query } from '@nestjs/common';


@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  //  SOLO MIS FINANZAS (PRO)
  @Get('my-finances')
@UseGuards(AuthGuard('jwt'),RolesGuard)
@Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
getMyFinances(
  @Req() req: any,
  @Query('filter') filter: string
) {
  return this.financeService.getFinanceByUser(req.user.uuid, filter);
}

  // Obtener un bolsillo por UUID
  @Get('financeById/:uuid')
  getFinanceById(@Param('uuid') uuid: string) {
    return this.financeService.getFinanceById(uuid);
  }

  // Crear un bolsillo financiero (PRO)
  @Post('crearFinance')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  create(
    @Body() createFinanceDto: CreateFinanceDto,
    @Req() req: any,
  ) {
    return this.financeService.create(
      createFinanceDto,
      req.user.uuid, //  usuario desde JWT
    );
  }

  // Actualizar un bolsillo
  @Patch('actualizarFinance/:uuid')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
update(
  @Param('uuid') uuid: string,
  @Body() updateFinanceDto: UpdateFinanceDto,
  @Req() req: any,
) {
  return this.financeService.update(
    uuid,
    updateFinanceDto,
    req.user.uuid, // 🔥 enviamos el usuario autenticado
  );
}

  // Eliminar un bolsillo
  @Delete('eliminarFinance/:uuid')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
remove(
  @Param('uuid') uuid: string,
  @Req() req: any,
) {
  return this.financeService.remove(uuid, req.user.uuid);
}

}