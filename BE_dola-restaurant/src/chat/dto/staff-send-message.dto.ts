import { IsString, IsNotEmpty } from 'class-validator';

export class StaffSendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}