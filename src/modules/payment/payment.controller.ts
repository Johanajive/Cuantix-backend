import { Controller, Post, Body, Req, HttpCode, UseGuards } from '@nestjs/common';
import { MercadoPagoService } from './mercado-pago.service';
import { PlanType } from '../../enums/planType.enum';
import { AuthGuard } from '@nestjs/passport';

@Controller('payment')
export class MercadoPagoController {
  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('preference')
  async createPreference(
    @Body('plan') plan: PlanType,
    @Req() req: any,
  ) {
    const userId = req.user.uuid; 

    const initPoint =
      await this.mercadoPagoService.createPreference(
        plan,
        userId,
      );

    return { initPoint };
  }

  @Post('webhook')
  @HttpCode(200)
  async receiveWebhook(@Body() body: any) {
    return this.mercadoPagoService.handleWebhook(body);
  }
}