import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Users } from '../../entities/user.entity';
import { Agent } from '../../entities/agent.entity';
import { Session, SessionStatus } from '../../entities/session.entity';
import { AdvisoryRequest, RequestStatus } from '../../entities/advisoryRequest.entity';
import { RoleEnum } from '../../enums/role.enum';

@Injectable()
export class DashboardAdminService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,

    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,

    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,

    @InjectRepository(AdvisoryRequest)
    private readonly requestRepo: Repository<AdvisoryRequest>,
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
      default:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
    }
  }

  async getStats(filter: string) {
    const { start, end } = this.getDateRange(filter);

    const [
      pendingAgents,
      approvedAgents,
      rejectedAgents,     
      totalUsers,
      paidUsers,
      newUsersInPeriod,
      completedSessions,
      cancelledSessions,
      totalSessions,
      pendingRequests,
    ] = await Promise.all([
      // Pendientes: ni aprobados ni rechazados
      this.usersRepo.count({ where: { role: RoleEnum.AGENT, isApproved: false, isRejected: false } }),

      // Aprobados
      this.usersRepo.count({ where: { role: RoleEnum.AGENT, isApproved: true } }),

      // Rechazados
      this.usersRepo.count({ where: { role: RoleEnum.AGENT, isRejected: true } }),

      this.usersRepo.count({ where: { role: RoleEnum.USERFREE } }),
      this.usersRepo.count({ where: { isPremium: true, subscriptionStatus: 'ACTIVE' } }),
      this.usersRepo
        .createQueryBuilder('u')
        .where('u.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),
      this.sessionRepo.count({ where: { status: SessionStatus.COMPLETED, scheduledAt: Between(start, end) } }),
      this.sessionRepo.count({ where: { status: SessionStatus.CANCELLED, scheduledAt: Between(start, end) } }),
      this.sessionRepo.count({ where: { scheduledAt: Between(start, end) } }),
      this.requestRepo
        .createQueryBuilder('r')
        .where('r.status = :status', { status: RequestStatus.PENDING })
        .andWhere('r.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),
    ]);

    return {
      pendingAgents,
      approvedAgents,
      rejectedAgents,
      totalUsers,
      paidUsers,
      newUsersInPeriod,
      sessions: {
        completed: completedSessions,
        cancelled: cancelledSessions,
        total: totalSessions,
        pending: totalSessions - completedSessions - cancelledSessions,
      },
      pendingRequests,
    };
  }

  async getChartData(filter: string) {
    const now = new Date();

    if (filter === 'day') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();

      const slots = [
        { label: 'Mañana',  start: new Date(Date.UTC(year, month, day, 6,  0, 0)), end: new Date(Date.UTC(year, month, day, 12, 0, 0)) },
        { label: 'Tarde',   start: new Date(Date.UTC(year, month, day, 12, 0, 0)), end: new Date(Date.UTC(year, month, day, 18, 0, 0)) },
        { label: 'Noche',   start: new Date(Date.UTC(year, month, day, 18, 0, 0)), end: new Date(Date.UTC(year, month, day + 1, 0, 0, 0)) },
      ];

      return Promise.all(slots.map(async (slot) => {
        const [sessions, newAgents, newUsers] = await Promise.all([
          this.sessionRepo.count({ where: { scheduledAt: Between(slot.start, slot.end) } }),
          this.usersRepo.createQueryBuilder('u').where('u.role = :role', { role: RoleEnum.AGENT }).andWhere('u.createdAt BETWEEN :s AND :e', { s: slot.start, e: slot.end }).getCount(),
          this.usersRepo.createQueryBuilder('u').where('u.role = :role', { role: RoleEnum.USERFREE }).andWhere('u.createdAt BETWEEN :s AND :e', { s: slot.start, e: slot.end }).getCount(),
        ]);
        return { label: slot.label, sessions, newAgents, newUsers };
      }));
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

      return Promise.all(slots.map(async (slot) => {
        const [sessions, newAgents, newUsers] = await Promise.all([
          this.sessionRepo.count({ where: { scheduledAt: Between(slot.start, slot.end) } }),
          this.usersRepo.createQueryBuilder('u').where('u.role = :role', { role: RoleEnum.AGENT }).andWhere('u.createdAt BETWEEN :s AND :e', { s: slot.start, e: slot.end }).getCount(),
          this.usersRepo.createQueryBuilder('u').where('u.role = :role', { role: RoleEnum.USERFREE }).andWhere('u.createdAt BETWEEN :s AND :e', { s: slot.start, e: slot.end }).getCount(),
        ]);
        return { label: slot.label, sessions, newAgents, newUsers };
      }));
    }

    const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return Promise.all(MONTHS.map(async (label, i) => {
      const start = new Date(now.getFullYear(), i, 1);
      const end   = new Date(now.getFullYear(), i + 1, 1);
      const [sessions, newAgents, newUsers] = await Promise.all([
        this.sessionRepo.count({ where: { scheduledAt: Between(start, end) } }),
        this.usersRepo.createQueryBuilder('u').where('u.role = :role', { role: RoleEnum.AGENT }).andWhere('u.createdAt BETWEEN :s AND :e', { s: start, e: end }).getCount(),
        this.usersRepo.createQueryBuilder('u').where('u.role = :role', { role: RoleEnum.USERFREE }).andWhere('u.createdAt BETWEEN :s AND :e', { s: start, e: end }).getCount(),
      ]);
      return { label, sessions, newAgents, newUsers };
    }));
  }

  async getTopAgents(filter: string) {
    const { start, end } = this.getDateRange(filter);
    const agents = await this.agentRepo.find({ relations: ['user'] });

    const data = await Promise.all(
      agents.map(async (agent) => {
        const [completed, total] = await Promise.all([
          this.sessionRepo.count({ where: { agent: { uuid: agent.uuid }, status: SessionStatus.COMPLETED, scheduledAt: Between(start, end) } }),
          this.sessionRepo.count({ where: { agent: { uuid: agent.uuid }, scheduledAt: Between(start, end) } }),
        ]);
        return {
          uuid:     agent.user.uuid,
          name:     `${agent.user.name} ${agent.user.lastName}`,
          photoUrl: agent.user.avatar ?? null,
          completed,
          total,
        };
      })
    );

    return data.filter(a => a.total > 0).sort((a, b) => b.completed - a.completed);
  }

  async getAgentsBySpecialty() {
    const agents = await this.agentRepo.find({ relations: ['user'] });
    const map: Record<string, number> = {};
    for (const a of agents) {
      const key = a.specialty ?? 'Sin especialidad';
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }
}