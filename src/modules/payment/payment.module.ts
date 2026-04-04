import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MercadoPagoService } from './mercado-pago.service';
import { MercadoPagoController } from './payment.controller';
import { FacturaPago } from '../../entities/facturaPago.entity';
import { Users } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FacturaPago, Users]) 
  ],
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService],
})
export class PaymentModule {}