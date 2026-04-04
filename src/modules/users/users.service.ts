import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from "./dto/CreateUser.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Users } from "../../entities/user.entity";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(Users)
        private readonly usersDatabase: Repository<Users>,
    ) { }

    async getAllUsers() {
        const users = await this.usersDatabase.find({ where: { status: true } });
        if (!users || users.length === 0) {
            throw new NotFoundException('No hay usuarios disponibles')
        }
        return users
    }

    async getUserById(uuid: string) {
        const findUser = await this.usersDatabase.findOne({
            where: { uuid: uuid },
        });
        if (!findUser) throw new NotFoundException(`Este usuario con el id ${uuid} no existe`)
        return findUser
    }

    async getUserByEmail(email: string) {
        const userEmail = await this.usersDatabase.findOne({
            where: { email: email },
        });
        if (!userEmail) throw new NotFoundException(`Este email ${email} no existe`)
        return userEmail
    }

    async getUserByAs(as: string) {
        const userAs = await this.usersDatabase.find({ where: { as: as } })
        if (!userAs || userAs.length === 0) {
            throw new NotFoundException('No hay usuarios disponibles')
        }
        return userAs
    }

    async create(newUser: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(newUser.password, 10)
        const userCreated = this.usersDatabase.create({ ...newUser, password: hashedPassword })
        return this.usersDatabase.save(userCreated)
    }

    async update(uuid: string, updateUser: any) {
        const user = await this.usersDatabase.findOne({ where: { uuid } });

        if (!user) {
            throw new NotFoundException("Usuario no encontrado");
        }

        // Extraer password y currentPassword del objeto antes de procesar
        const { password, currentPassword, ...restData } = updateUser;

        // Si quiere cambiar contraseña
        if (password) {
            if (!currentPassword) {
                throw new BadRequestException("Debes proporcionar la contraseña actual");
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);

            if (!isMatch) {
                throw new BadRequestException("La contraseña actual es incorrecta");
            }

            // Hash de la nueva contraseña
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        // Actualizar el resto de campos (sin incluir password ni currentPassword)
        Object.assign(user, restData);

        await this.usersDatabase.save(user);

        // No devolver la contraseña
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async disabled(uuid: string) {
        const userFind = await this.usersDatabase.findOne({ where: { uuid: uuid } });
        if (!userFind) { 
            throw new NotFoundException(`Usuario con ID ${uuid} no encontrado`) 
        }

        userFind.status = false;
        await this.usersDatabase.save(userFind);
        return { message: `Usuario con el ID ${uuid} ha sido desactivado correctamente`, userFind }
    }

    async updateAvatar(uuid: string, avatar: string) {
        const user = await this.usersDatabase.findOne({ where: { uuid } });

        if (!user) {
            throw new NotFoundException("Usuario no encontrado");
        }

        user.avatar = avatar;

        await this.usersDatabase.save(user);

        // No devolver la contraseña
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}