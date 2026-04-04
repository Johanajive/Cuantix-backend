import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyPinDto {
    @IsEmail({}, { message: 'El correo electrónico no es válido, debe seguir el formato' })
    @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío' })
    @Length(5, 320, { message: 'El correo debe tener entre 5 y 320 caracteres' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'El pin no puede estar vacío' })
    pin: string;
}
