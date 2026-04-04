import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { Users } from "../entities/user.entity";
import { RoleEnum } from "../enums/role.enum";
import { Gender } from "../enums/gender.enum";

@Injectable()
export class AdminSeed implements OnModuleInit {

    constructor(
        @InjectRepository(Users)
        private readonly usersDatabase: Repository<Users>,
    ) { }

    async onModuleInit() {
        await this.createAdmin();
        await this.createPremiumUser();
        await this.createPremiumUserdos()
    }

    private async createAdmin() {
        const existingAdmin = await this.usersDatabase.findOne({
            where: { role: RoleEnum.ADMIN },
        });

        if (existingAdmin) {
            console.log("Admin ya existe");
            return;
        }

        const hashedPassword = await bcrypt.hash("Admin123*", 10);

        const admin = this.usersDatabase.create({
            name: "Admin",
            lastName: "Principal",
            as: "admin",
            email: "cuantix02@gmail.com",
            password: hashedPassword,
            role: RoleEnum.ADMIN,
            isApproved: true,
            phone: "0000000000",
            birthDate: new Date().toISOString().split("T")[0], // DATE seguro
            idCard: "00000000",
            gender: Gender.OTRO,
        });

        await this.usersDatabase.save(admin);

        console.log("Admin creado automáticamente");
        console.log("Email: cuantix02@gmail.com");
        console.log("Password: Admin123*");
    }


    private async createPremiumUser() {

        const existingUser = await this.usersDatabase.findOne({
            where: { email: "premium@cuantix.com" },
        });

        if (existingUser) {
            console.log("Usuario premium ya existe");
            return;
        }

        const hashedPassword = await bcrypt.hash("User123*", 10);

        // Fecha de expiración en 1 año
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);

        const premiumUser = this.usersDatabase.create({
            name: "Usuario",
            lastName: "Premium",
            as: "premium",
            email: "premium@cuantix.com",
            password: hashedPassword,

            role: RoleEnum.USERPREMIUM,
            isPremium: true,
            subscriptionStatus: "ACTIVE",
            subscriptionExpiresAt: nextYear,
            isApproved: true,

            phone: "3000000000",
            birthDate: "2000-01-01",
            idCard: "11111111",
            gender: Gender.OTRO,
        });

        await this.usersDatabase.save(premiumUser);

        console.log("Usuario Premium creado automáticamente");
        console.log("Email: premium@cuantix.com");
        console.log("Password: User123*");
    }

    private async createPremiumUserdos() {

        const existingUser = await this.usersDatabase.findOne({
            where: { email: "premiumdos@cuantix.com" },
        });

        if (existingUser) {
            console.log("Usuario premium ya existe");
            return;
        }

        const hashedPassword = await bcrypt.hash("User123*", 10);

        // Fecha de expiración en 1 año
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);

        const premiumUser = this.usersDatabase.create({
            name: "Usuario",
            lastName: "Premium",
            as: "premiuum",
            email: "premiumdos@cuantix.com",
            password: hashedPassword,

            role: RoleEnum.USERPREMIUM,
            isPremium: true,
            subscriptionStatus: "ACTIVE",
            subscriptionExpiresAt: nextYear,
            isApproved: true,

            phone: "3000000000",
            birthDate: "2000-01-01",
            idCard: "11111112",
            gender: Gender.OTRO,
        });

        await this.usersDatabase.save(premiumUser);

        console.log("Usuario Premium creado automáticamente");
        console.log("Email: premiumdos@cuantix.com");
        console.log("Password: User123*");
    }
}