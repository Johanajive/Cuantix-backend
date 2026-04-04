// users/dto/Login.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  as: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
