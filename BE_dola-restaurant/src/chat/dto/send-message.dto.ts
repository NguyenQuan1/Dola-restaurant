import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];

  // Nếu chưa có session (lần chat đầu tiên), controller sẽ tự tạo mới
  @IsOptional()
  @IsString()
  sessionId?: string;
}