import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../users/dto/CreateUser.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../users/dto/Login.dto';
import { OAuth2Client } from 'google-auth-library';
import { BadRequestException } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { RoleEnum } from '../../enums/role.enum';

@Injectable()
export class AuthService {
    private googleClient: OAuth2Client;

    constructor(
        @InjectRepository(Users)
        private usersDatabase: Repository<Users>,

        private readonly emailService: EmailService,

        private jwtService: JwtService
    ) {
        this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    async register(data: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const registerUser = this.usersDatabase.create({
            ...data,
            password: hashedPassword,
            subscriptionStatus: 'PENDING',
            isPremium: false,
        });

        await this.usersDatabase.save(registerUser);

        await this.emailService.sendWelcomeRegister(
            registerUser.email,
            registerUser.name,
        );

        //Generar JWT automáticamente
        const payload = {
            sub: registerUser.uuid,
            as: registerUser.as,
        };

        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: {
                id: registerUser.uuid,
                as: registerUser.as,
                email: registerUser.email,
                subscriptionStatus: registerUser.subscriptionStatus,
            }
        };
    }

    async login(data: LoginDto) {
        const user = await this.usersDatabase.findOne({
            where: [
                { as: data.as },
                { email: data.as },
            ],
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Contraseña incorrecta');
        }

        // ===============================
        // GENERAR TOKEN
        // ===============================

        const payloadToken = {
            uuid: user.uuid,
            email: user.email,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
        };

        const token = await this.jwtService.signAsync(payloadToken);

        try {
            await this.emailService.sendLoginAlert(user.email, user.name);
        } catch (error) {
            console.error('Error enviando login alert:', error);
        }

        return {
            accessToken: token,
            user: {
                uuid: user.uuid,
                name: user.name,
                as: user.as,
                email: user.email,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus,
                isPremium: user.isPremium,
                isApproved: user.isApproved,
            },
        };
    }

    // =====================
    // LOGIN GOOGLE
    // =====================
    async googleLogin(token: string) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            throw new UnauthorizedException('Token de Google inválido');
        }

        const email = payload.email;

        const user = await this.usersDatabase.findOne({ where: { email } });

        if (!user) {
            throw new UnauthorizedException('El correo de Google no está registrado');
        }

        // =====================================
        // VALIDACIONES SEGÚN ROL
        // =====================================

        // AGENTE: permitir login siempre, el frontend maneja la redirección

        // USUARIO NORMAL: debe tener suscripción activa
        if (user.role === RoleEnum.USERFREE) {
            if (!user.isPremium || user.subscriptionStatus !== 'ACTIVE') {
                throw new UnauthorizedException(
                    'Tu cuenta no tiene una suscripción activa. Debes adquirir un plan premium.'
                );
            }
        }

        // =====================================
        // GENERAR TOKEN
        // =====================================

        const payloadToken = {
            uuid: user.uuid,
            email: user.email,
            name: user.name,
            role: user.role,
        };

        const jwt = await this.jwtService.signAsync(payloadToken);

        return {
            accessToken: jwt,
            user: {
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                isApproved: user.isApproved,  // ← agregado por tu compañera
            }
        };
    }

    // =============================================
    // RECUPERAR CONTRASEÑA / SOLICITAR RECUPERACIÓN
    // =============================================
    async requestPasswordReset(email: string) {
        try {
            const user = await this.usersDatabase.findOne({ where: { email } });

            if (!user) {
                throw new BadRequestException('El correo no está registrado');
            }

            if (!user.isPremium || user.subscriptionStatus !== 'ACTIVE') {
                throw new BadRequestException('Tu cuenta no tiene una suscripción activa.');
            }

            const pin = Math.floor(100000 + Math.random() * 900000).toString();

            user.resetPin = pin;
            user.resetPinExpires = new Date(Date.now() + 10 * 60 * 1000);

            await this.usersDatabase.save(user);

            try {
                await this.emailService.sendResetPin(email, pin);
            } catch (error) {
                console.error('Error enviando correo:', error);
            }

            return { message: 'PIN enviado al correo' };

        } catch (error) {
            console.error('ERROR GENERAL RESET:', error);
            throw error;
        }
    }

    // ==============
    // VERIFICAR PIN
    // ==============
    async verifyPin(email: string, pin: string) {
        const user = await this.usersDatabase.findOne({ where: { email } });

        if (!user || user.resetPin !== pin) {
            throw new BadRequestException('PIN incorrecto');
        }

        if (!user.resetPinExpires || user.resetPinExpires < new Date()) {
            throw new BadRequestException('El PIN ha expirado');
        }

        return { message: 'PIN válido' };
    }

    // ==================
    // CAMBIAR CONTRASEÑA
    // ==================
    async resetPassword(email: string, pin: string, newPassword: string) {
        const user = await this.usersDatabase.findOne({ where: { email } });

        if (!user || user.resetPin !== pin) {
            throw new BadRequestException('PIN inválido');
        }

        if (!user.resetPinExpires || user.resetPinExpires < new Date()) {
            throw new BadRequestException('El PIN ha expirado');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetPin = null;
        user.resetPinExpires = null;

        await this.usersDatabase.save(user);

        return { message: 'Contraseña actualizada correctamente' };
    }
}