import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';//Es una herramienta que trae Passport para ayudarte a extraer el token.

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),//“De dónde sacar el JWT cuando llegue una petición, y en este acso es “Extrae el token del header Authorization cuando venga como Bearer
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET_KEY')
        });
    }

    async validate(payload: any) {
        return { uuid: payload.uuid, email: payload.email, role: payload.role};
    }
}
