import { Controller } from '@nestjs/common';
import { RecurringFinanceService } from './recurring-finance.service';
import { Body, Post, UseGuards, Req, Get, Patch, Param } from '@nestjs/common';
import { CreateRecurringFinanceDto } from './dto/CreateRecurringFinanceDto';
import { AuthGuard } from '@nestjs/passport'; 
import { UpdateRecurringFinanceDto } from './dto/UpdateRecurringFinanceDto';
import { Roles } from '../auth/role.decorator';
import { RolesGuard } from '../auth/role.guard';
import { RoleEnum } from '../../enums/role.enum';

@Controller('recurringFinance')
export class RecurringFinanceController {
  constructor(private readonly recurringFinanceService: RecurringFinanceService) {}


  @Post('createRecurring')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  create(
    @Body() dto: CreateRecurringFinanceDto,
    @Req() req: any,
  ) {
    return this.recurringFinanceService.createRecurringFinanceService(dto, req.user.uuid);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  getMyRecurring(@Req() req: any) {
    return this.recurringFinanceService.getAllRecurringFinancesByUserId(req.user.uuid);
  }

  @Patch('createFinanceByRecurring/:uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  markAsPaid(
    @Param('uuid') uuid: string,
    @Req() req: any,
  ) {
    return this.recurringFinanceService.createFinanceFromRecurringFinanceService(uuid, req.user.uuid);
  }

  @Patch('deactivate/:uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
  deactivate(
    @Param('uuid') uuid: string,
    @Req() req: any,
  ) {
    return this.recurringFinanceService.deletedeRecurringFinanceService(uuid, req.user.uuid);
  }
 
  @Patch('updateRecurring/:uuid')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
update(
  @Param('uuid') uuid: string,
  @Body() dto: UpdateRecurringFinanceDto,
  @Req() req: any,
) {
  return this.recurringFinanceService.editRecurringFinanceService(
    uuid,
    dto,
    req.user.uuid,
  );
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.USERPREMIUM, RoleEnum.USERFREE)
@Get('overdue')
getOverdue(@Req() req) {
  return this.recurringFinanceService.getOverdueRecurring(req.user.uuid);
}

}