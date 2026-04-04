import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { AdvisoryRequest, RequestStatus } from '../../entities/advisoryRequest.entity';
import { Session, SessionStatus } from '../../entities/session.entity';
import { Agent } from '../../entities/agent.entity';
import { Users } from '../../entities/user.entity';

@Injectable()
export class DashboardAgentService {
  constructor(
    @InjectRepository(AdvisoryRequest)
    private readonly requestRepo: Repository<AdvisoryRequest>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
  ) { }

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
      case 'week': {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { start, end: new Date() };
      }
      default: // month
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
    }
  }

  async getStats(userUuid: string, filter: string) {
  const agent = await this.agentRepo.findOne({
    where: { user: { uuid: userUuid } },
    relations: ['user'],
  });
  if (!agent) throw new NotFoundException('Agente no encontrado');

  const { start, end } = this.getDateRange(filter);

  // 🔹 COMPLETADAS
  const completed = await this.sessionRepo.count({
    where: {
      agent: { uuid: agent.uuid },
      status: SessionStatus.COMPLETED,
      scheduledAt: Between(start, end),
    },
  });

  // 🔹 CANCELADAS
  const cancelled = await this.sessionRepo.count({
    where: {
      agent: { uuid: agent.uuid },
      status: SessionStatus.CANCELLED,
      scheduledAt: Between(start, end),
    },
  });

  // 🔹 TOTAL
  const totalSessions = await this.sessionRepo.count({
    where: {
      agent: { uuid: agent.uuid },
      scheduledAt: Between(start, end),
    },
  });

  // 🔹 PENDIENTES (AHORA FILTRADO ✔)
  const pendingToComplete = await this.sessionRepo.count({
    where: {
      agent: { uuid: agent.uuid },
      status: SessionStatus.SCHEDULED,
      scheduledAt: Between(start, end), 
    },
  });

  // 🔹 CLIENTES (AHORA FILTRADO ✔)
  const approvedUsers = await this.sessionRepo
    .createQueryBuilder('s')
    .leftJoin('s.user', 'user')
    .where('s.agentId = :agentId', { agentId: agent.uuid })
    .andWhere('s.scheduledAt BETWEEN :start AND :end', { start, end })
    .andWhere('s.status IN (:...statuses)', {
      statuses: [
        SessionStatus.SCHEDULED,
        SessionStatus.COMPLETED,
        SessionStatus.CANCELLED,
      ],
    })
    .select('COUNT(DISTINCT user.uuid)', 'count')
    .getRawOne();

  const newClients = Number(approvedUsers?.count || 0);

  // 🔹 RECHAZADOS
  const rejected = await this.requestRepo.count({
    where: {
      agent: { uuid: agent.uuid },
      status: RequestStatus.REJECTED,
      createdAt: Between(start, end),
    },
  });

  return {
    newClients,
    sessions: {
      completed,
      cancelled,
      rejected,
    },
    totalSessions,
    pendingSessions: totalSessions - completed - cancelled,
    pendingToComplete,
  };
}

  async getChartData(userUuid: string, filter: string) {
    const agent = await this.agentRepo.findOne({
      where: { user: { uuid: userUuid } },
      relations: ['user'],
    });
    if (!agent) throw new NotFoundException('Agente no encontrado');

    const now = new Date();

    if (filter === 'day') {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();

      // Slots en UTC para que coincidan con cómo se guardan las sesiones
      const slots: { label: string; start: Date; end: Date }[] = [
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

      const data = await Promise.all(slots.map(async (slot) => {
        const completed = await this.sessionRepo.count({
          where: { agent: { uuid: agent.uuid }, status: SessionStatus.COMPLETED, scheduledAt: Between(slot.start, slot.end) },
        });
        const cancelled = await this.sessionRepo.count({
          where: { agent: { uuid: agent.uuid }, status: SessionStatus.CANCELLED, scheduledAt: Between(slot.start, slot.end) },
        });
        const total = await this.sessionRepo.count({
          where: { agent: { uuid: agent.uuid }, scheduledAt: Between(slot.start, slot.end) },
        });
        const clients = await this.sessionRepo
          .createQueryBuilder('s')
          .leftJoin('s.user', 'user')
          .where('s.agentId = :agentId', { agentId: agent.uuid })
          .andWhere('s.scheduledAt BETWEEN :start AND :end', { start: slot.start, end: slot.end })
          .select('COUNT(DISTINCT user.uuid)', 'count')
          .getRawOne();
        return {
          label: slot.label,
          completed,
          cancelled,
          total,
          newClients: Number(clients?.count || 0),
        };
      }));

      return data;
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

      const data = await Promise.all(slots.map(async (slot) => {
        const completed = await this.sessionRepo.count({
          where: { agent: { uuid: agent.uuid }, status: SessionStatus.COMPLETED, scheduledAt: Between(slot.start, slot.end) },
        });
        const cancelled = await this.sessionRepo.count({
          where: { agent: { uuid: agent.uuid }, status: SessionStatus.CANCELLED, scheduledAt: Between(slot.start, slot.end) },
        });
        const total = await this.sessionRepo.count({
          where: { agent: { uuid: agent.uuid }, scheduledAt: Between(slot.start, slot.end) },
        });
        const clients = await this.sessionRepo
          .createQueryBuilder('s').leftJoin('s.user', 'user')
          .where('s.agentId = :agentId', { agentId: agent.uuid })
          .andWhere('s.scheduledAt BETWEEN :start AND :end', { start: slot.start, end: slot.end })
          .select('COUNT(DISTINCT user.uuid)', 'count').getRawOne();
        return { label: slot.label, completed, cancelled, total, newClients: Number(clients?.count || 0) };
      }));
      return data;
    }

    // year
    const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data = await Promise.all(MONTHS.map(async (label, i) => {
      const start = new Date(now.getFullYear(), i, 1);
      const end = new Date(now.getFullYear(), i + 1, 1);
      const completed = await this.sessionRepo.count({
        where: { agent: { uuid: agent.uuid }, status: SessionStatus.COMPLETED, scheduledAt: Between(start, end) },
      });
      const cancelled = await this.sessionRepo.count({
        where: { agent: { uuid: agent.uuid }, status: SessionStatus.CANCELLED, scheduledAt: Between(start, end) },
      });
      const total = await this.sessionRepo.count({
        where: { agent: { uuid: agent.uuid }, scheduledAt: Between(start, end) },
      });
      const clients = await this.sessionRepo
        .createQueryBuilder('s').leftJoin('s.user', 'user')
        .where('s.agentId = :agentId', { agentId: agent.uuid })
        .andWhere('s.scheduledAt BETWEEN :start AND :end', { start, end })
        .select('COUNT(DISTINCT user.uuid)', 'count').getRawOne();
      return { label, completed, cancelled, total, newClients: Number(clients?.count || 0) };
    }));
    return data;
  }

  async getTopAgents() {
    const agents = await this.agentRepo.find({ relations: ['user'] });
    const data = await Promise.all(
      agents.map(async (agent) => {
        const totalSessions = await this.sessionRepo.count({
          where: { agent: { uuid: agent.uuid }, status: SessionStatus.COMPLETED },
        });
        return {
          uuid: agent.user.uuid,
          name: `${agent.user.name} ${agent.user.lastName}`,
          totalSessions, photoUrl: agent.user.avatar ?? null,
        };
      })
    );
    return data
      .filter(a => a.totalSessions > 0)
      .sort((a, b) => b.totalSessions - a.totalSessions);
  }
}