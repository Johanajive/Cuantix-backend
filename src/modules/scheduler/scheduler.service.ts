import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringFinance } from '../../entities/recurringFinance.entity';
import { Investment } from '../../entities/Investment.entity';
import { Saving } from '../../entities/Saving.entity';
import { NotificationsService } from '../notification/notification.service';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationSource, NotificationType } from '../../entities/notification.entity';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(RecurringFinance)
    private readonly recurringRepo: Repository<RecurringFinance>,

    @InjectRepository(Investment)
    private readonly investmentRepo: Repository<Investment>,

    @InjectRepository(Saving)
    private readonly savingRepo: Repository<Saving>,

    private readonly notificationsService: NotificationsService,
    private readonly firebaseService: FirebaseService,
  ) {}

  // =========================================
  // 🕗 CRON: todos los días a las 8:00 AM (Bogotá)
  // =========================================
  @Cron('0 8 * * *', { timeZone: 'America/Bogota' })
  async handleDailyNotifications() {
    this.logger.log('🔔 Ejecutando cron de notificaciones...');

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // 🔥 Usar fechas locales de Bogotá, no UTC
    const todayStr    = this.toLocalDate(today);
    const tomorrowStr = this.toLocalDate(tomorrow);

    this.logger.log(`📅 Procesando hoy: ${todayStr} | mañana: ${tomorrowStr}`);

    await Promise.all([
      this.processRecurring(todayStr, tomorrowStr),
      this.processInvestments(todayStr, tomorrowStr),
      this.processSavings(todayStr, tomorrowStr),
    ]);

    this.logger.log('✅ Cron de notificaciones finalizado');
  }

  // =========================================
  // HELPER: fecha local Bogotá como string YYYY-MM-DD
  // =========================================
  private toLocalDate(date: Date): string {
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    // en-CA usa formato YYYY-MM-DD
  }

  // =========================================
  // RECURRING FINANCES
  // =========================================
  private async processRecurring(todayStr: string, tomorrowStr: string) {
    const items = await this.recurringRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .where('r.isActive = true')
      .andWhere('r.nextDueDate IN (:...dates)', {
        dates: [todayStr, tomorrowStr],
      })
      .getMany();

    this.logger.log(`📋 Recurrentes encontrados: ${items.length}`);

    for (const item of items) {
      const dueDateStr = typeof item.nextDueDate === 'string'
        ? item.nextDueDate
        : this.toLocalDate(new Date(item.nextDueDate));

      const isToday = dueDateStr === todayStr;

      const msg = this.notificationsService.buildRecurringMessage(
        item.name,
        Number(item.amount),
        item.financeType,
        isToday,
      );

      const notification = await this.notificationsService.createNotification({
        user: item.user,
        title: msg.title,
        body: msg.body,
        type: isToday ? NotificationType.DUE_TODAY : NotificationType.REMINDER,
        source: NotificationSource.RECURRING,
        sourceUuid: item.uuid,
        financeType: item.financeType,
      });

      if (notification && item.user['fcmToken']) {
        await this.firebaseService.sendPush(item.user['fcmToken'], msg.title, msg.body);
      }
    }
  }

  // =========================================
  // INVESTMENTS
  // =========================================
  private async processInvestments(todayStr: string, tomorrowStr: string) {
    const items = await this.investmentRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.user', 'user')
      .where('inv.isActive = true')
      .andWhere('CAST(inv.nextDueDate AS CHAR) IN (:...dates)', {
        dates: [todayStr, tomorrowStr],
      })
      .getMany();

    this.logger.log(`📋 Inversiones encontradas: ${items.length}`);

    for (const item of items) {
      const dueDateStr = this.toLocalDate(new Date(item.nextDueDate));
      const isToday = dueDateStr === todayStr;

      const msg = this.notificationsService.buildInvestmentMessage(
        item.name,
        Number(item.totalInvested),
        isToday,
      );

      const notification = await this.notificationsService.createNotification({
        user: item.user,
        title: msg.title,
        body: msg.body,
        type: isToday ? NotificationType.DUE_TODAY : NotificationType.REMINDER,
        source: NotificationSource.INVESTMENT,
        sourceUuid: item.uuid,
        financeType: undefined, // no aplica para inversiones
      });

      if (notification && item.user['fcmToken']) {
        await this.firebaseService.sendPush(item.user['fcmToken'], msg.title, msg.body);
      }
    }
  }

  // =========================================
  // SAVINGS
  // =========================================
  private async processSavings(todayStr: string, tomorrowStr: string) {
    const items = await this.savingRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'user')
      .where('s.isActive = true')
      .andWhere('s.isCompleted = false')
      .andWhere('CAST(s.nextDueDate AS CHAR) IN (:...dates)', {
        dates: [todayStr, tomorrowStr],
      })
      .getMany();

    this.logger.log(`📋 Ahorros encontrados: ${items.length}`);

    for (const item of items) {
      const dueDateStr = this.toLocalDate(new Date(item.nextDueDate));
      const isToday = dueDateStr === todayStr;

      const msg = this.notificationsService.buildSavingMessage(
        item.name,
        Number(item.budget),
        isToday,
      );

      const notification = await this.notificationsService.createNotification({
        user: item.user,
        title: msg.title,
        body: msg.body,
        type: isToday ? NotificationType.DUE_TODAY : NotificationType.REMINDER,
        source: NotificationSource.SAVING,
        sourceUuid: item.uuid,
        financeType: undefined, // no aplica para ahorros
      });

      if (notification && item.user['fcmToken']) {
        await this.firebaseService.sendPush(item.user['fcmToken'], msg.title, msg.body);
      }
    }
  }
}