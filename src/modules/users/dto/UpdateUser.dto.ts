import { IsString, IsEmail, IsNotEmpty, Length, Matches, IsEnum, IsOptional } from 'class-validator';
import { Gender } from '../../../enums/gender.enum';

export class updateUserDto {
    @IsOptional()
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
    @Length(3, 20, { message: 'El nombre debe tener entre 3 y 20 caracteres' })
    @Matches(/^[A-Za-z]+$/, {
        message: 'En el nombre no se permiten espacios y debe ser una cadena de texto',
    })
    name?: string;

    @IsOptional()
    @IsString({ message: 'El apellido debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
    @Length(3, 20, { message: 'El apellido debe tener entre 3 y 20 caracteres' })
    lastName?: string;

    @IsOptional()
    @IsEmail({}, { message: 'El correo electrónico no es válido, debe seguir el formato' })
    @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío' })
    @Length(5, 320, { message: 'El correo debe tener entre 5 y 320 caracteres' })
    email?: string;

    @IsOptional()
    @IsString({ message: 'El número de celular debe ser una cadena de caracteres' })
    @IsNotEmpty({ message: 'El número de celular no puede estar vacío' })
    @Length(10, 10, { message: 'El número de celular debe tener 10 caracteres' })
    @Matches(/^[0-9]+$/, {
        message: 'En el numero de celular solo se permiten números',
    })
    @Matches(/^3\d{9}$/, {
        message: 'El número de celular debe iniciar con 3 y tener 10 dígitos (Colombia)',
    })
    phone?: string;

    @IsOptional()
    @IsNotEmpty({ message: 'La fecha de nacimiento no puede estar vacía' })
    @Matches(/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, {
        message: 'La fecha debe tener formato yyyy-mm-dd',
    })
    birthDate?: string;

    @IsOptional()
    @IsNotEmpty({ message: 'La cédula es obligatoria' })
    @Matches(/^[0-9]{7,12}$/, {
        message: 'La cédula debe tener entre 7 y 12 dígitos, sin espacios ni letras',
    })
    @Matches(/^[0-9]+$/, {
        message: 'La cédula solo permite números',
    })
    idCard?: string;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @Length(8, 15, { message: 'La contraseña debe tener entre 8 a 15 caracteres' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/, {
        message:
            'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial',
    })
    password?: string;

    @IsOptional()
    @IsString()
    currentPassword?: string;
}