import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/CreateUser.dto';
import { updateUserDto } from './dto/UpdateUser.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    @Get()
    getAllUsers() {
        return this.usersService.getAllUsers();
    }

    @Get('usuarioById/:uuid')
    getUserById(@Param('uuid') uuid: string) {
        return this.usersService.getUserById(uuid);
    }

    @Get('usuarioByEmail/:email')
    getUserByEmail(@Param('email') email: string) {
        return this.usersService.getUserByEmail(email);
    }

    @Get('usuarioByAlias/:as')
    getUserByAs(@Param('as') as: string) {
        return this.usersService.getUserByAs(as);
    }

    @Post('crearUsuario')
    postCreateUser(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Patch('actualizarUsuario/:uuid')
    update(@Param('uuid') uuid: string, @Body() body: updateUserDto) {
        return this.usersService.update(uuid, body);
    }

    @Delete('eliminarUsuario/:uuid')
    disabled(@Param('uuid') uuid: string) {
        return this.usersService.disabled(uuid);
    }

    @Patch('avatar/:uuid')
    @UseInterceptors(FileInterceptor('avatar', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = './uploads/avatars';
                
                // Verificar que la carpeta existe
                if (!fs.existsSync(uploadPath)) {
                    console.log('Carpeta no existe, creándola:', uploadPath);
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const fileExtension = extname(file.originalname);
                const nameWithoutExt = file.originalname.replace(fileExtension, '');
                
                const sanitizedName = nameWithoutExt
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');
                
                const uniqueName = `${Date.now()}_${sanitizedName}${fileExtension}`;
                
                console.log('Nombre original:', file.originalname);
                console.log('Nombre sanitizado:', uniqueName);
                
                cb(null, uniqueName);
            }
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return cb(new BadRequestException('Solo se permiten imágenes (jpg, jpeg, png, gif, webp)'), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024
        }
    })) 
    async updateAvatar(
        @Param('uuid') uuid: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException("No se envió ningún archivo");
        }

        const avatarPath = `/uploads/avatars/${file.filename}`;
        
        // VERIFICACIÓN CRÍTICA: Confirmar que el archivo se guardó
        const fullPath = path.join(process.cwd(), 'uploads', 'avatars', file.filename);
        const fileExists = fs.existsSync(fullPath);
        
        console.log('Avatar guardado en:', avatarPath);
        console.log('Ruta completa:', fullPath);
        console.log('Archivo existe en disco:', fileExists);
        
        if (!fileExists) {
            console.error('❌ ERROR: El archivo NO se guardó en disco');
            throw new BadRequestException('Error al guardar el archivo');
        }
        
        console.log('URL del avatar:', `http://localhost:3000${avatarPath}`);
        
        return this.usersService.updateAvatar(uuid, avatarPath);
    }
}