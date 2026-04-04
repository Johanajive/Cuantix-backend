import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Users } from '../../entities/user.entity';
import { RoleEnum } from '../../enums/role.enum';
import { Gender } from '../../enums/gender.enum';

// Roles que se consideran "usuarios" (excluye ADMIN y AGENT)
const USER_ROLES = [RoleEnum.USERFREE, RoleEnum.USERPREMIUM];

@Injectable()
export class DashboardUserService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
  ) {}

  private getDateRange(filter: string): { start: Date; end: Date } {
    const now = new Date();
    switch (filter) {
      case 'day':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        };
      case 'year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear() + 1, 0, 1),
        };
      default: // month
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
    }
  }

  async getStats(filter: string) {
    const { start, end } = this.getDateRange(filter);

    const [
      totalUsers,
      premiumUsers,
      freeUsers,
      newUsersInPeriod,
      newPremiumInPeriod,
      maleUsers,
      femaleUsers,
      nonBinaryUsers,
      otherGenderUsers,
      activeSubscriptions,
      cancelledSubscriptions,
      pendingSubscriptions,
    ] = await Promise.all([
      // Total: USERFREE + USERPREMIUM
      this.usersRepo.count({
        where: { role: In(USER_ROLES) },
      }),

      // Premium: isPremium true con suscripción ACTIVE (cualquier rol de usuario)
      this.usersRepo.count({
        where: { role: In(USER_ROLES), isPremium: true, subscriptionStatus: 'ACTIVE' },
      }),

      // Free: no premium
      this.usersRepo.count({
        where: { role: In(USER_ROLES), isPremium: false },
      }),

      // Nuevos en período
      this.usersRepo
        .createQueryBuilder('u')
        .where('u.role IN (:...roles)', { roles: USER_ROLES })
        .andWhere('u.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),

      // Nuevos premium en período
      this.usersRepo
        .createQueryBuilder('u')
        .where('u.role IN (:...roles)', { roles: USER_ROLES })
        .andWhere('u.isPremium = true')
        .andWhere('u.subscriptionStatus = :status', { status: 'ACTIVE' })
        .andWhere('u.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),

      // Género
      this.usersRepo.count({ where: { role: In(USER_ROLES), gender: Gender.MASCULINO } }),
      this.usersRepo.count({ where: { role: In(USER_ROLES), gender: Gender.FEMENINO } }),
      this.usersRepo.count({ where: { role: In(USER_ROLES), gender: Gender.NO_BINARO } }),
      this.usersRepo.count({ where: { role: In(USER_ROLES), gender: Gender.OTRO } }),

      // Suscripciones
      this.usersRepo.count({ where: { role: In(USER_ROLES), subscriptionStatus: 'ACTIVE' } }),
      this.usersRepo.count({ where: { role: In(USER_ROLES), subscriptionStatus: 'CANCELLED' } }),
      this.usersRepo.count({ where: { role: In(USER_ROLES), subscriptionStatus: 'PENDING' } }),
    ]);

    const premiumRate = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;

    return {
      totalUsers,
      premiumUsers,
      freeUsers,
      newUsersInPeriod,
      newPremiumInPeriod,
      premiumRate,
      gender: {
        male: maleUsers,
        female: femaleUsers,
        nonBinary: nonBinaryUsers,
        other: otherGenderUsers,
      },
      subscriptions: {
        active: activeSubscriptions,
        cancelled: cancelledSubscriptions,
        pending: pendingSubscriptions,
      },
    };
  }

  async getChartData(filter: string) {
    const now = new Date();

    if (filter === 'day') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();

      const slots = [
        {
          label: 'Mañana',
          start: new Date(Date.UTC(year, month, day, 6, 0, 0)),
          end: new Date(Date.UTC(year, month, day, 12, 0, 0)),
        },
        {
          label: 'Tarde',
          start: new Date(Date.UTC(year, month, day, 12, 0, 0)),
          end: new Date(Date.UTC(year, month, day, 18, 0, 0)),
        },
        {
          label: 'Noche',
          start: new Date(Date.UTC(year, month, day, 18, 0, 0)),
          end: new Date(Date.UTC(year, month, day + 1, 0, 0, 0)),
        },
      ];

      return Promise.all(
        slots.map(async (slot) => {
          const [newUsers, newPremium] = await Promise.all([
            this.usersRepo
              .createQueryBuilder('u')
              .where('u.role IN (:...roles)', { roles: USER_ROLES })
              .andWhere('u.createdAt BETWEEN :s AND :e', { s: slot.start, e: slot.end })
              .getCount(),
            this.usersRepo
              .createQueryBuilder('u')
              .where('u.role IN (:...roles)', { roles: USER_ROLES })
              .andWhere('u.isPremium = true')
              .andWhere('u.createdAt BETWEEN :s AND :e', { s: slot.start, e: slot.end })
              .getCount(),
          ]);
          return { label: slot.label, newUsers, newPremium };
        }),
      );
    }

    if (filter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const slots = Array.from({ length: 4 }, (_, i) => {
        const start = new Date(monthStart);
        start.setDate(1 + i * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return { label: `Semana ${i + 1}`, start, end };
      });

      return Promise.all(
        slots.map(async (slot) => {
          const [newUsers, newPremium] = await Promise.all([
            this.usersRepo
              .createQueryBuilder('u')
              .where('u.role IN (:...roles)', { roles: USER_ROLES })
              .andWhere('u.createdAt BETWEEN :s AND :e', { s: slot.start, e: slot.end })
              .getCount(),
            this.usersRepo
              .createQueryBuilder('u')
              .where('u.role IN (:...roles)', { roles: USER_ROLES })
              .andWhere('u.isPremium = true')
              .andWhere('u.createdAt BETWEEN :s AND :e', { s: slot.start, e: slot.end })
              .getCount(),
          ]);
          return { label: slot.label, newUsers, newPremium };
        }),
      );
    }

    // year — monthly breakdown
    const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return Promise.all(
      MONTHS.map(async (label, i) => {
        const start = new Date(now.getFullYear(), i, 1);
        const end = new Date(now.getFullYear(), i + 1, 1);
        const [newUsers, newPremium] = await Promise.all([
          this.usersRepo
            .createQueryBuilder('u')
            .where('u.role IN (:...roles)', { roles: USER_ROLES })
            .andWhere('u.createdAt BETWEEN :s AND :e', { s: start, e: end })
            .getCount(),
          this.usersRepo
            .createQueryBuilder('u')
            .where('u.role IN (:...roles)', { roles: USER_ROLES })
            .andWhere('u.isPremium = true')
            .andWhere('u.createdAt BETWEEN :s AND :e', { s: start, e: end })
            .getCount(),
        ]);
        return { label, newUsers, newPremium };
      }),
    );
  }

  async getGenderBreakdown() {
    const genders = [
      { key: Gender.MASCULINO, label: 'Masculino' },
      { key: Gender.FEMENINO,  label: 'Femenino' },
      { key: Gender.NO_BINARO, label: 'No binario' },
      { key: Gender.OTRO,      label: 'Otro' },
    ];

    const results = await Promise.all(
      genders.map(async (g) => ({
        name: g.label,
        value: await this.usersRepo.count({
          where: { role: In(USER_ROLES), gender: g.key },
        }),
      })),
    );

    return results.filter((r) => r.value > 0);
  }

  async getRecentUsers(limit = 10) {
    const users = await this.usersRepo.find({
      where: { role: In(USER_ROLES) },
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['uuid', 'name', 'lastName', 'email', 'gender', 'isPremium', 'subscriptionStatus', 'createdAt', 'avatar'],
    });

    return users.map((u) => ({
      uuid: u.uuid,
      name: `${u.name} ${u.lastName}`,
      email: u.email,
      gender: u.gender,
      isPremium: u.isPremium,
      subscriptionStatus: u.subscriptionStatus,
      createdAt: u.createdAt,
      avatar: u.avatar ?? null,
    }));
  }

  async getSubscriptionTrend(filter: string) {
    const { start, end } = this.getDateRange(filter);

    const [newSubscriptions, renewals, cancellations] = await Promise.all([
      this.usersRepo
        .createQueryBuilder('u')
        .where('u.role IN (:...roles)', { roles: USER_ROLES })
        .andWhere('u.isPremium = true')
        .andWhere('u.subscriptionStatus = :status', { status: 'ACTIVE' })
        .andWhere('u.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),

      this.usersRepo
        .createQueryBuilder('u')
        .where('u.role IN (:...roles)', { roles: USER_ROLES })
        .andWhere('u.isPremium = true')
        .andWhere('u.subscriptionStatus = :status', { status: 'ACTIVE' })
        .andWhere('u.subscriptionExpiresAt > :now', { now: new Date() })
        .getCount(),

      this.usersRepo
        .createQueryBuilder('u')
        .where('u.role IN (:...roles)', { roles: USER_ROLES })
        .andWhere('u.subscriptionStatus = :status', { status: 'CANCELLED' })
        .andWhere('u.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),
    ]);

    return { newSubscriptions, renewals, cancellations };
  }
}