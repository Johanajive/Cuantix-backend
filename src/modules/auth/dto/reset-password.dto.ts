import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
    @IsEmail({}, { message: 'El correo electrónico no es válido, debe seguir el formato' })
    @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío' })
    @Length(5, 320, { message: 'El correo debe tener entre 5 y 320 caracteres' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'El pin no puede estar vacío' })
    pin: string;

    @Length(8, 15, { message: 'La contraseña debe tener entre 8 a 15 caracteres' })
    @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/, {
        message:
            'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial',
    })
    newPassword: string;
}
