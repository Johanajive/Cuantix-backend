// ── register-agent.dto.ts ─────────────────────────────────────────────────
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterAgentDto {
    @IsString()
    name: string;

    @IsString()
    lastName: string;

    @IsString()
    as: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    specialty: string;

    @IsString()
    experience: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value ?? null)
    documentUrl: string | null = null;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value ?? null)
    diplomaUrl: string | null = null;
}