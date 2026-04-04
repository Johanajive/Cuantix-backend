import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Users } from '../../entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { EmailModule } from '../email/email.module';
import { Agent } from '../../entities/agent.entity';

@Module({
  imports: [
    ConfigModule,//Permite usar variables del .env:
    TypeOrmModule.forFeature([Users, Agent]),
    PassportModule.register({ defaultStrategy: 'jwt' }),// importante aca ya mamos la que ya creamos en strategy y es la que estamos usando si queremos otra usamos otra, y necesita que tu escojas una forma o extrategia de autenticación, en este caso JWT hay mas estrategias como local, google, facebook, etc. y aquí le digo que la estrategia por defecto es JWT

    EmailModule,
    
    JwtModule.registerAsync({
      imports: [ConfigModule], // Trae otros módulos que necesitas
      inject: [ConfigService],// Le dice a Nest qué servicio quieres usar
      //Función que devuelve la configuración del JWT, y aquí es donde le digo que va a usar la clave secreta que tengo en el .env y también le digo cuanto tiempo va a durar el token y una vez vaya a crear el signAsync Ya sabe: Qué secret usar Cuánto dura el token
      useFactory: (config: ConfigService) => ({//esto es una funcion que retorna un objeto de configuración para el JWT, y aquí es donde le digo que va a usar la clave secreta que tengo en el .env y también le digo cuanto tiempo va a durar el token y una vez vaya a crear el signAsync Ya sabe: Qué secret usar Cuánto dura el token
        secret: config.get<string>('JWT_SECRET_KEY'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthModule { }
