import { IsOptional, IsString } from 'class-validator';

export class EscalateSessionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}