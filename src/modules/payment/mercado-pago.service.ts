import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { PlanType } from '../../enums/planType.enum';
import { PLAN_CONFIG } from '../../configPlan/plan.config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FacturaPago } from '../../entities/facturaPago.entity';
import { Users } from '../../entities/user.entity';
import { RoleEnum } from '../../enums/role.enum';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;

  constructor(
    @InjectRepository(FacturaPago)
    private readonly facturaRepo: Repository<FacturaPago>,

    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
  ) {
    const accessToken = process.env.ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('ACCESS_TOKEN no está configurado');
    }

    this.client = new MercadoPagoConfig({
      accessToken,
    });
  }

  async createPreference(plan: PlanType, userId: string): Promise<string> {
    try {
      const planData = PLAN_CONFIG[plan];

      if (!planData) {
        throw new Error('Plan inválido');
      }

      const preference = new Preference(this.client);

      const now = new Date();
const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
console.log("TOKEN ACTUAL:", process.env.ACCESS_TOKEN);
console.log("BASE_URL_FRONT:", process.env.BASE_URL_FRONT);
const response = await preference.create({
  body: {
    items: [
      {
        id: plan,
        title: planData.title,
        unit_price: Number(planData.price),
        quantity: 1,
        currency_id: 'COP',
      },
    ],
    external_reference: userId,
    notification_url: `${process.env.BASE_URL_NOGROK}/payment/webhook`,
    back_urls: {
      success: `${process.env.BASE_URL_FRONT}/payment-success`,
      failure: `${process.env.BASE_URL_FRONT}/payment-failure`,
      pending: `${process.env.BASE_URL_FRONT}/payment-pending`,
    },
  },
});

const initPoint = response.sandbox_init_point;

if (!initPoint) {
  throw new Error('No se pudo generar el link de pago');
}

return initPoint;

    } catch (error: any) {
      console.error('Error creando preferencia en MercadoPago:', error);

      throw new Error(
        error?.message || 'Error al crear preferencia en MercadoPago',
      );
    }
  }

  async handleWebhook(body: any) {
    console.log("🔥 WEBHOOK RECIBIDO:", body);
    try {
      if (body.type !== 'payment') {
        return { message: 'Evento ignorado' };
      }

      const paymentIdRaw = body.data?.id;
      if (!paymentIdRaw) {
        return { message: 'Sin payment id' };
      }

      const paymentId = paymentIdRaw.toString();

      const payment = new Payment(this.client);
      const paymentInfo = await payment.get({ id: paymentId });

      if (!paymentInfo) {
        throw new Error('No se encontró el pago');
      }

      if (paymentInfo.status === 'approved') {
  console.log("✅ Pago aprobado, activando usuario...");
} else {
  console.log("⚠️ Estado recibido:", paymentInfo.status);
  return { message: 'Pago aún no aprobado' };
}

      const userId = paymentInfo.external_reference;

      const user = await this.userRepo.findOne({
        where: { uuid: userId },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const planId =
        paymentInfo.additional_info?.items?.[0]?.id as PlanType;

      const paidAt = paymentInfo.date_approved
        ? new Date(paymentInfo.date_approved)
        : new Date();

      const factura = this.facturaRepo.create({
        user: user,
        paymentId: paymentId,
        amount: paymentInfo.transaction_amount,
        currency: paymentInfo.currency_id,
        status: paymentInfo.status,
        plan: planId,
        paidAt: paidAt,
      });

      await this.facturaRepo.save(factura);

      //ACTIVAR SUSCRIPCIÓN PREMIUM
      user.subscriptionStatus = 'ACTIVE';
      user.isPremium = true;
      user.role = RoleEnum.USERPREMIUM;

      const expiration = new Date();
      expiration.setMonth(expiration.getMonth() + 1);
      user.subscriptionExpiresAt = expiration;

      await this.userRepo.save(user);

      await this.userRepo.save(user);

      return { message: 'Pago procesado y usuario activado correctamente' };

    } catch (error) {
      console.error('Error en webhook:', error);
      return { error: 'Error procesando webhook' };
    }
  }
}