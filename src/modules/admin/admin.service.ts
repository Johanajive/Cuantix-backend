import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "../../entities/user.entity"; 
import { Repository } from "typeorm";
import { RoleEnum } from "../../enums/role.enum"; 
import { Agent } from "../../entities/agent.entity"; 
import { EmailService } from "../email/email.service";
import { Session } from "../../entities/session.entity";

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Users)
        private usersDatabase: Repository<Users>,

        @InjectRepository(Agent)
        private agentRepository: Repository<Agent>,

        @InjectRepository(Session)
        private sessionRepo: Repository<Session>,

        private readonly emailService: EmailService,
    ) {}

    async getApprovedAgents() {
        const agents = await this.agentRepository.find({
            relations: ['user'],
            where: {
                user: {
                    role: RoleEnum.AGENT,
                    isApproved: true,
                },
            },
        });

        return agents.map(agent => ({
            uuid: agent.user.uuid,
            name: agent.user.name,
            lastName: agent.user.lastName,
            email: agent.user.email,
            specialty: agent.specialty,
            experience: agent.experience,
            documentUrl: agent.documentUrl,
            diplomaUrl: agent.diplomaUrl,
        }));
    }

    async getPendingAgents() {
        const agents = await this.agentRepository.find({
            relations: ['user'],
            where: {
                user: {
                    role: RoleEnum.AGENT,
                    isApproved: false,
                    isRejected: false,
                },
            },
        });

        return agents.map(agent => ({
            uuid: agent.user.uuid,
            name: agent.user.name,
            lastName: agent.user.lastName,
            email: agent.user.email,
            experience: agent.experience,
            specialty: agent.specialty,
            documentUrl: agent.documentUrl,
            diplomaUrl: agent.diplomaUrl,
        }));
    }

    async approveAgent(uuid: string) {
        const user = await this.usersDatabase.findOne({
            where: { uuid, role: RoleEnum.AGENT },
        });

        if (!user) throw new NotFoundException('Asesor no encontrado');

        user.isApproved = true;
        user.isRejected = false;
        await this.usersDatabase.save(user);

        await this.emailService.sendAgentApproved(user.email, user.name);

        return { message: 'Asesor aprobado correctamente' };
    }

    async deleteAgent(uuid: string) {
        const user = await this.usersDatabase.findOne({ where: { uuid } });

        if (!user) throw new NotFoundException('Usuario no encontrado');

        user.isApproved = false;
        user.isRejected = true;
        await this.usersDatabase.save(user);

        try {
            await this.emailService.sendAgentRejected(user.email, user.name);
        } catch (error) {
            console.error('Error enviando correo de rechazo:', error);
        }

        return { message: 'Asesor rechazado correctamente' };
    }

    async getDashboardStats() {
        const pendingAgents = await this.usersDatabase.count({
            where: { role: RoleEnum.AGENT, isApproved: false, isRejected: false },
        });

        const approvedAgents = await this.usersDatabase.count({
            where: { role: RoleEnum.AGENT, isApproved: true },
        });

        const totalUsers = await this.usersDatabase.count({
            where: { role: RoleEnum.USERFREE },
        });

        const paidUsers = await this.usersDatabase.count({
            where: { isPremium: true, subscriptionStatus: 'ACTIVE' },
        });

        return { pendingAgents, approvedAgents, totalUsers, paidUsers };
    }
}