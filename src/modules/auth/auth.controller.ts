import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/CreateUser.dto';
import { LoginDto } from '../users/dto/Login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { RequestResetDto } from './dto/request-reset.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() data: CreateUserDto) {
        return this.authService.register(data);
    }

    @Post('login')
    login(@Body() data: LoginDto) {
        return this.authService.login(data);
    }

    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    // ===========================
    // INICIO DE SESIÓN CON GOOGLE
    // ===========================

    @Post("google")
    google(@Body("token") token: string) {
        return this.authService.googleLogin(token);
    }

    // =====================
    // RECUPERAR CONTRASEÑA 
    // =====================

    @Post('request-reset')
    requestReset(@Body() body: RequestResetDto) {
        return this.authService.requestPasswordReset(body.email);
    }

    @Post('verify-pin')
    verifyPin(@Body() body: VerifyPinDto) {
        return this.authService.verifyPin(body.email, body.pin);
    }

    @Post('reset-password')
    resetPassword(@Body() body: ResetPasswordDto) {
        return this.authService.resetPassword(
            body.email,
            body.pin,
            body.newPassword,
        );
    }
}