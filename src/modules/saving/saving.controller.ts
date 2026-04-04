import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Delete } from '@nestjs/common';
import { SavingService } from './saving.service';
import { CreateSavingDto } from './dto/CreateSavingDto';
import { AddSavingAmountDto } from './dto/AddSavingAmountDto';
import { AuthGuard } from '@nestjs/passport';

@Controller('saving')
@UseGuards(AuthGuard('jwt')) 
export class SavingController {
  constructor(private readonly savingService: SavingService) {}

  // ===============================
  // CREAR AHORRO
  // POST /saving
  // ===============================
  @Post()
  async create(
    @Body() dto: CreateSavingDto,
    @Req() req,
  ) {
    const userId = req.user.uuid;
    return this.savingService.create(dto, userId);
  }

  // ===============================
  // AGREGAR DINERO
  // POST /saving/:uuid/pay
  // ===============================
  @Post(':uuid/pay')
  async addAmount(
    @Param('uuid') uuid: string,
    @Body() dto: AddSavingAmountDto,
    @Req() req,
  ) {
    const userId = req.user.uuid;

    return this.savingService.addSavingAmount(
      uuid,
      dto,
      userId,
    );
  }

  // ===============================
  // LISTAR AHORROS
  // GET /saving
  // ===============================
  @Get()
  async findAll(@Req() req) {
    const userId = req.user.uuid;
    return this.savingService.findAllByUser(userId);
  }

  // ===============================
// ELIMINAR AHORRO
// DELETE /saving/:uuid
// ===============================
@Delete(':uuid')
async delete(
  @Param('uuid') uuid: string,
  @Req() req,
) {
  const userId = req.user.uuid;

  return this.savingService.deleteSaving(uuid, userId);
}

}