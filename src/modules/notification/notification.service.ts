import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationSource, NotificationType } from '../../entities/notification.entity';
import { Users } from '../../entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  // ===========================
  // CREAR NOTIFICACIÓN EN DB
  // ===========================
  async createNotification(params: {
    user: Users;
    title: string;
    body: string;
    type: NotificationType;
    source: NotificationSource;
    sourceUuid: string;
    financeType?: string;
  }) {
    const today = new Date().toISOString().split('T')[0];

    // 🔥 No crear si ya existe UNA ACTIVA hoy para este source+uuid+type
    // Si el usuario la descartó (isActive=false) tampoco se recrea — eso es intencional
    const existing = await this.notificationRepo
      .createQueryBuilder('n')
      .where('n.userUuid = :userId', { userId: params.user.uuid })
      .andWhere('n.sourceUuid = :sourceUuid', { sourceUuid: params.sourceUuid })
      .andWhere('n.type = :type', { type: params.type })
      .andWhere('DATE(n.createdAt) = :today', { today })
      .getOne();

    if (existing) return null; // ya existe (activa o descartada) — no crear duplicado

    const notification = this.notificationRepo.create({
      ...params,
      isRead: false,
      isActive: true,
    });

    return this.notificationRepo.save(notification);
  }

  // ===========================
  // OBTENER NOTIFICACIONES ACTIVAS DEL USUARIO
  // ===========================
  async getByUser(userId: string) {
    return this.notificationRepo.find({
      where: {
        user: { uuid: userId },
        isActive: true,   // 🔥 solo las activas — las descartadas no se listan
      },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // ===========================
  // MARCAR COMO LEÍDA Y DESACTIVAR (checkbox del usuario)
  // ===========================
  async dismiss(uuid: string, userId: string) {
    await this.notificationRepo.update(
      { uuid, user: { uuid: userId } },
      { isRead: true, isActive: false }, // 🔥 leída + desactivada = nunca más aparece
    );
    return { message: 'Notificación descartada' };
  }

  // ===========================
  // MARCAR COMO LEÍDA (solo visual, sigue activa)
  // ===========================
  async markAsRead(uuid: string, userId: string) {
    await this.notificationRepo.update(
      { uuid, user: { uuid: userId } },
      { isRead: true },
    );
    return { message: 'Notificación marcada como leída' };
  }

  // ===========================
  // MARCAR TODAS COMO LEÍDAS Y DESACTIVAR
  // ===========================
  async markAllAsRead(userId: string) {
    await this.notificationRepo.update(
      { user: { uuid: userId }, isRead: false, isActive: true },
      { isRead: true, isActive: false }, // 🔥 también las desactiva todas
    );
    return { message: 'Todas las notificaciones fueron descartadas' };
  }

  // ===========================
  // CONTAR NO LEÍDAS (solo activas)
  // ===========================
  async countUnread(userId: string) {
    const count = await this.notificationRepo.count({
      where: {
        user: { uuid: userId },
        isRead: false,
        isActive: true,   // 🔥 solo contar las activas
      },
    });
    return { unread: count };
  }

  // ===========================
  // GENERADORES DE MENSAJES
  // ===========================
  buildSavingMessage(name: string, amount: number, isToday: boolean) {
    if (isToday) {
      return {
        title: '🐷 Día de ahorro',
        body: `Hoy debes abonar a tu meta "${name}" - $${amount.toLocaleString('es-CO')}`,
      };
    }
    return {
      title: '🐷 Recordatorio de ahorro',
      body: `Tu meta "${name}" vence mañana. ¡Tenla en cuenta! - $${amount.toLocaleString('es-CO')}`,
    };
  }

  buildInvestmentMessage(name: string, amount: number, isToday: boolean) {
    if (isToday) {
      return {
        title: '📈 Día de inversión',
        body: `Hoy debes abonar a tu inversión "${name}" - $${amount.toLocaleString('es-CO')}`,
      };
    }
    return {
      title: '📈 Recordatorio de inversión',
      body: `Tu inversión "${name}" vence mañana. ¡Prepárala! - $${amount.toLocaleString('es-CO')}`,
    };
  }

  buildRecurringMessage(name: string, amount: number, financeType: string, isToday: boolean) {
    const isIngreso = financeType === 'INGRESO';

    if (isToday) {
      return {
        title: isIngreso ? '💵 Ingreso esperado hoy' : '💸 Pago vence hoy',
        body: isIngreso
          ? `Hoy deberías recibir "${name}" - $${amount.toLocaleString('es-CO')}`
          : `Hoy vence tu pago "${name}" - $${amount.toLocaleString('es-CO')}`,
      };
    }

    return {
      title: isIngreso ? '💵 Ingreso mañana' : '💸 Pago vence mañana',
      body: isIngreso
        ? `Mañana deberías recibir "${name}" - $${amount.toLocaleString('es-CO')}`
        : `"${name}" vence mañana, recuerda pagarlo - $${amount.toLocaleString('es-CO')}`,
    };
  }
}