import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Users } from '../../entities/user.entity';
import { RoleEnum } from '../../enums/role.enum';
import { EmailService } from '../email/email.service';

@Injectable()
export class SubscriptionService {
    constructor(
        @InjectRepository(Users)
        private userRepo: Repository<Users>,
        private readonly emailService: EmailService,
    ) { }

    // Se ejecuta cada día a medianoche
    @Cron('0 0 * * *')
    async checkExpiredSubscriptions() {
        const now = new Date();

        const expiredUsers = await this.userRepo.find({
            where: {
                subscriptionExpiresAt: LessThan(now),
                isPremium: true,
            },
        });

        for (const user of expiredUsers) {
            user.isPremium = false;
            user.subscriptionStatus = 'INACTIVE';
            user.role = RoleEnum.USERFREE;

            await this.userRepo.save(user);

            await this.emailService.sendPlanExpired(
                user.email,
                user.name,
            );
        }
    }

    @Cron('0 12 * * *')
    async notifyExpiringSoon() {
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        const users = await this.userRepo.find({
            where: {
                subscriptionExpiresAt: Between(now, threeDaysFromNow),
                isPremium: true,
            },
        });

        for (const user of users) {
            await this.emailService.sendExpirationWarning(
                user.email,
                user.name
            );
        }
    }

}
