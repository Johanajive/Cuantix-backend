import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSessionDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string; 

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsUUID()
  @IsNotEmpty()
  userId: string; // UUID del usuario que agenda

  @IsUUID()
  @IsNotEmpty()
  agentId: string; // UUID del agente (del perfil Agent, no User)
}