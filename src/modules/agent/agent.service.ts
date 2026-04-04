import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository, Between, In } from 'typeorm';
import { Agent } from '../../entities/agent.entity';
import { Users } from '../../entities/user.entity';
import { AdvisoryRequest, RequestStatus } from '../../entities/advisoryRequest.entity'
import { Session, SessionStatus } from '../../entities/session.entity';
import { CreateSessionDto } from './dto/createSession.dto';
import { Review } from '../../entities/review.entity';
import { RegisterAgentDto } from './dto/register-agent';
import { RoleEnum } from '../../enums/role.enum';
import { CaseDocument } from '../../entities/caseDocument.entity'; 

@Injectable()
export class AgentService {
    constructor(
        @InjectRepository(Agent)
        private readonly agentRepo: Repository<Agent>,

        @InjectRepository(Users)
        private readonly usersRepo: Repository<Users>,

        @InjectRepository(AdvisoryRequest)
        private readonly requestRepo: Repository<AdvisoryRequest>,

        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,

        @InjectRepository(Review)
        private readonly reviewRepo: Repository<Review>,

        @InjectRepository(CaseDocument)
        private readonly caseDocRepo: Repository<CaseDocument>,
    ) { }

    async registerAgent(dto: RegisterAgentDto) {
        const existingUser = await this.usersRepo.findOne({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new BadRequestException('El correo ya está registrado');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = this.usersRepo.create({
            name: dto.name,
            lastName: dto.lastName,
            email: dto.email,
            password: hashedPassword,
            as: dto.as,
            role: RoleEnum.AGENT,
        });

        await this.usersRepo.save(user);

        const agent = new Agent();
        agent.experience = dto.experience;
        agent.specialty = dto.specialty;
        agent.documentUrl = dto.documentUrl ?? null;
        agent.diplomaUrl = dto.diplomaUrl ?? null;
        agent.user = user;

        await this.agentRepo.save(agent);

        return {
            message: 'Asesor registrado correctamente',
            agentUuid: agent.uuid,
        };
    }

    private async findAgentByUserUuid(userUuid: string): Promise<Agent> {
        const agent = await this.agentRepo.findOne({
            where: { user: { uuid: userUuid } },
            relations: ['user'],
        });
        if (!agent) throw new NotFoundException('Perfil de asesor no encontrado');
        return agent;
    }

    async getAgentRequests(userUuid: string) {
        const agent = await this.findAgentByUserUuid(userUuid);

        const sessions = await this.sessionRepo.find({
            where: {
                agent: { uuid: agent.uuid },
                status: SessionStatus.PENDING,
            },
            relations: ['user'],
            order: { scheduledAt: 'ASC' },
        });

        return sessions.map((s) => ({
            uuid: s.uuid,
            userName: `${s.user?.name ?? ''} ${s.user?.lastName ?? ''}`.trim(),
            userEmail: s.user?.email ?? '',
            topic: s.topic,
            notes: s.notes,
            scheduledAt: s.scheduledAt,
            durationMinutes: s.durationMinutes,
            status: s.status,
        }));
    }

    async createRequest(data: {
        topic: string;
        message: string;
        userId: string;
        agentId: string;
    }) {
        const user = await this.usersRepo.findOne({ where: { uuid: data.userId } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const agent = await this.agentRepo.findOne({ where: { uuid: data.agentId } });
        if (!agent) throw new NotFoundException('Agente no encontrado');

        const request = this.requestRepo.create({
            topic: data.topic,
            message: data.message,
            user,
            agent,
        });
        return this.requestRepo.save(request);
    }

    async acceptRequest(requestUuid: string) {
        const request = await this.requestRepo.findOne({ where: { uuid: requestUuid } });
        if (!request) throw new NotFoundException('Solicitud no encontrada');
        if (request.status !== RequestStatus.PENDING)
            throw new BadRequestException('Solo se pueden aceptar solicitudes pendientes');

        request.status = RequestStatus.ACCEPTED;
        await this.requestRepo.save(request);
        return { message: 'Solicitud aceptada', request };
    }

    async rejectRequest(requestUuid: string) {
        const request = await this.requestRepo.findOne({ where: { uuid: requestUuid } });
        if (!request) throw new NotFoundException('Solicitud no encontrada');
        if (request.status !== RequestStatus.PENDING)
            throw new BadRequestException('Solo se pueden rechazar solicitudes pendientes');

        request.status = RequestStatus.REJECTED;
        await this.requestRepo.save(request);
        return { message: 'Solicitud rechazada', request };
    }

    async getAgentClients(userUuid: string) {
        const agent = await this.findAgentByUserUuid(userUuid);

        const sessions = await this.sessionRepo.find({
            where: {
                agent: { uuid: agent.uuid },
                status: In([SessionStatus.SCHEDULED, SessionStatus.COMPLETED]),
            },
            relations: ['user'],
            order: { scheduledAt: 'DESC' },
        });

        const seen = new Set<string>();
        const clients: any[] = [];
        for (const s of sessions) {
            if (s.user && !seen.has(s.user.uuid)) {
                seen.add(s.user.uuid);
                clients.push({
                    uuid: s.user.uuid,
                    name: s.user.name,
                    lastName: s.user.lastName,
                    email: s.user.email,
                    phone: s.user.phone ?? null,
                    lastTopic: s.topic,
                    since: s.scheduledAt,
                });
            }
        }
        return clients;
    }

    async getAgentSessions(userUuid: string) {
        const agent = await this.findAgentByUserUuid(userUuid);

        const sessions = await this.sessionRepo.find({
            where: { agent: { uuid: agent.uuid } },
            relations: ['user'],
            order: { scheduledAt: 'ASC' },
        });

        return sessions.map((s) => ({
            uuid: s.uuid,
            scheduledAt: s.scheduledAt,
            durationMinutes: s.durationMinutes,
            topic: s.topic,
            notes: s.notes,
            status: s.status,
            userName: `${s.user?.name ?? ''} ${s.user?.lastName ?? ''}`.trim(),
            userEmail: s.user?.email ?? '',
        }));
    }

    async createSession(dto: CreateSessionDto) {
        const user = await this.usersRepo.findOne({ where: { uuid: dto.userId } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const agent = await this.agentRepo.findOne({ where: { uuid: dto.agentId } });
        if (!agent) throw new NotFoundException('Agente no encontrado');

        const scheduledAt = new Date(dto.scheduledAt);
        const duration = dto.durationMinutes ?? 60;
        const endTime = new Date(scheduledAt.getTime() + duration * 60_000);

        const conflict = await this.sessionRepo
            .createQueryBuilder('s')
            .where('s.agentId = :agentId', { agentId: agent.uuid })
            .andWhere('s.status != :cancelled', { cancelled: SessionStatus.CANCELLED })
            .andWhere('s.scheduledAt < :end', { end: endTime })
            .andWhere(
                `DATE_ADD(s.scheduledAt, INTERVAL s.durationMinutes MINUTE) > :start`,
                { start: scheduledAt },
            )
            .getOne();

        if (conflict)
            throw new BadRequestException('Ese horario ya está ocupado. Por favor elige otro.');

        const newSession = new Session();
        newSession.scheduledAt = scheduledAt;
        newSession.durationMinutes = duration;
        newSession.topic = dto.topic;
        newSession.notes = dto.notes ?? null;
        newSession.status = SessionStatus.PENDING;
        newSession.user = user;
        newSession.agent = agent;

        return this.sessionRepo.save(newSession);
    }

    async cancelSession(sessionUuid: string) {
        const session = await this.sessionRepo.findOne({ where: { uuid: sessionUuid } });
        if (!session) throw new NotFoundException('Sesión no encontrada');

        session.status = SessionStatus.CANCELLED;
        await this.sessionRepo.save(session);
        return { message: 'Sesión cancelada', session };
    }

    async completeSession(sessionUuid: string) {
        const session = await this.sessionRepo.findOne({ where: { uuid: sessionUuid } });
        if (!session) throw new NotFoundException('Sesión no encontrada');

        session.status = SessionStatus.COMPLETED;
        await this.sessionRepo.save(session);
        return { message: 'Sesión completada', session };
    }

    async getAllPublicAgents() {
        const agents = await this.agentRepo.find({
            relations: ['user'],
            where: {
                user: {
                    isApproved: true,
                }
            }
        });

        return agents.map(agent => ({
            agentUuid: agent.uuid,
            name: agent.user.name,
            lastName: agent.user.lastName,
            avatar: agent.user.avatar ?? null,
            specialty: agent.specialty,
            experience: agent.experience,
        }));
    }

    async getAgentPublicProfile(agentUuid: string) {
        const agent = await this.agentRepo.findOne({
            where: { uuid: agentUuid },
            relations: ['user'],
        });
        if (!agent) throw new NotFoundException('Agente no encontrado');

        const user = agent.user;

        const completedSessions = await this.sessionRepo.count({
            where: { agent: { uuid: agentUuid }, status: SessionStatus.COMPLETED },
        });

        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60_000);

        const bookedSlots = await this.sessionRepo.find({
            where: {
                agent: { uuid: agentUuid },
                scheduledAt: Between(now, in30Days),
                status: SessionStatus.SCHEDULED,
            },
            select: ['scheduledAt', 'durationMinutes'],
        });

        return {
            agentUuid: agent.uuid,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            avatar: user.avatar ?? null,
            specialty: agent.specialty,
            experience: agent.experience,
            documentUrl: agent.documentUrl ?? null,
            completedSessions,
            bookedSlots: bookedSlots.map((s) => ({
                scheduledAt: s.scheduledAt,
                durationMinutes: s.durationMinutes,
            })),
        };
    }

    // ── SLOTS DISPONIBLES ────────────────────────────────
    // GET /agent/:agentUuid/available-slots?date=2025-03-15
    async getAvailableSlots(agentUuid: string, date: string) {
        //Parsear los componentes de la fecha para evitar desfase de timezone
        const [year, month, day] = date.split('-').map(Number);

        //Construir dayStart y dayEnd en UTC puro
        const dayStart = new Date(Date.UTC(year, month - 1, day, 8, 0, 0, 0));
        const dayEnd = new Date(Date.UTC(year, month - 1, day, 18, 0, 0, 0));

        const booked = await this.sessionRepo.find({
            where: {
                agent: { uuid: agentUuid },
                scheduledAt: Between(dayStart, dayEnd),
                status: In([SessionStatus.PENDING, SessionStatus.SCHEDULED]),
            },
        });

        const slots: { time: string; available: boolean }[] = [];

        for (let hour = 8; hour < 18; hour++) {
            // Cada slot también en UTC
            const slotStart = new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
            const slotEnd = new Date(slotStart.getTime() + 60 * 60_000);

            const isBusy = booked.some((b) => {
                const bStart = new Date(b.scheduledAt);
                const bEnd = new Date(bStart.getTime() + b.durationMinutes * 60_000);
                return slotStart < bEnd && slotEnd > bStart;
            });

            slots.push({ time: slotStart.toISOString(), available: !isBusy });
        }

        return slots;
    }

    async createReview(data: { agentId: string; userId: string; rating: number; comment: string }) {
        if (data.rating < 1 || data.rating > 5)
            throw new BadRequestException('La calificación debe ser entre 1 y 5');

        const user = await this.usersRepo.findOne({ where: { uuid: data.userId } });
        const agent = await this.agentRepo.findOne({ where: { uuid: data.agentId } });

        if (!user || !agent) throw new NotFoundException();

        const review = this.reviewRepo.create({
            user,
            agent,
            rating: data.rating,
            comment: data.comment,
        });

        return this.reviewRepo.save(review);
    }

    async getAgentReviews(agentUuid: string) {
        const reviews = await this.reviewRepo.find({
            where: { agent: { uuid: agentUuid } },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
        const avgRating = reviews.length
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
        return {
            reviews: reviews.map(r => ({
                uuid: r.uuid,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                userName: `${r.user?.name ?? ''} ${r.user?.lastName ?? ''}`.trim(),
            })),
            avgRating: Math.round(avgRating * 10) / 10,
            total: reviews.length,
        };
    }

    async acceptSession(sessionUuid: string) {
        const session = await this.sessionRepo.findOne({ where: { uuid: sessionUuid } });
        if (!session) throw new NotFoundException('Sesión no encontrada');
        session.status = SessionStatus.SCHEDULED;
        await this.sessionRepo.save(session);
        return { message: 'Sesión aceptada' };
    }

    async rejectSession(sessionUuid: string) {
        const session = await this.sessionRepo.findOne({
            where: { uuid: sessionUuid },
            relations: ['user', 'agent'],
        });
        if (!session) throw new NotFoundException('Sesión no encontrada');

        // Marca la sesión como cancelada
        session.status = SessionStatus.CANCELLED;
        await this.sessionRepo.save(session);

        // También crea/actualiza el registro en advisoryRequest como REJECTED
        // para que el dashboard pueda distinguir rechazos de cancelaciones
        const existingRequest = await this.requestRepo.findOne({
            where: {
                user: { uuid: session.user.uuid },
                agent: { uuid: session.agent.uuid },
                status: RequestStatus.PENDING,
            },
            relations: ['user', 'agent'],
        });

        if (existingRequest) {
            existingRequest.status = RequestStatus.REJECTED;
            await this.requestRepo.save(existingRequest);
        } else {
            // Si no hay request previa, crear una marcada como rechazada
            const newRequest = this.requestRepo.create({
                topic: session.topic,
                message: '',
                status: RequestStatus.REJECTED,
                user: session.user,
                agent: session.agent,
            });
            await this.requestRepo.save(newRequest);
        }

        return { message: 'Sesión rechazada' };
    }

    async uploadCaseDocument(
        agentUserUuid: string,
        userUuid: string,
        file: Express.Multer.File,
        note: string,
    ) {
        const agent = await this.findAgentByUserUuid(agentUserUuid);

        const user = await this.usersRepo.findOne({
            where: { uuid: userUuid },
        });

        if (!user) throw new NotFoundException('Usuario no encontrado');
        if (!file) throw new BadRequestException('Archivo requerido');

        const fileUrl = `/uploads/case-documents/${file.filename}`;

        const doc = this.caseDocRepo.create({
            fileName: file.originalname,
            fileUrl,
            note: note ?? null,
            user,
            agent,
        });

        return this.caseDocRepo.save(doc);
    }

    async getCaseData(agentUserUuid: string, userUuid: string) {
        const client = await this.usersRepo.findOne({
            where: { uuid: userUuid },
        });

        const documents = await this.caseDocRepo.find({
            where: {
                user: { uuid: userUuid },
                agent: { user: { uuid: agentUserUuid } },
            },
            relations: ['user', 'agent'],
            order: { createdAt: 'DESC' },
        });

        return { client, documents };
    }

    async updateCaseDocument(
        agentUserUuid: string,
        userUuid: string,
        documentUuid: string,
        note: string,
    ) {
        const document = await this.caseDocRepo.findOne({
            where: { uuid: documentUuid },
            relations: ['user', 'agent'],
        });

        if (!document) throw new NotFoundException('Documento no encontrado');

        document.note = note;
        return this.caseDocRepo.save(document);
    }

    async deleteCaseDocument(
        agentUserUuid: string,
        userUuid: string,
        documentUuid: string,
    ) {
        const document = await this.caseDocRepo.findOne({
            where: { uuid: documentUuid },
        });

        if (!document) throw new NotFoundException('Documento no encontrado');

        await this.caseDocRepo.remove(document);
        return { message: 'Documento eliminado correctamente' };
    }

    async getUserActiveSession(userId: string, agentId: string) {
        const session = await this.sessionRepo.findOne({
            where: {
                user: { uuid: userId },
                agent: { uuid: agentId },
                status: In([SessionStatus.PENDING, SessionStatus.SCHEDULED]),
            },
        });
        return { hasActiveSession: !!session, session: session ?? null };
    }
}