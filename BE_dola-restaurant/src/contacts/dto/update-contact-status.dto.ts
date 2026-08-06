import { IsBoolean } from 'class-validator';

export class UpdateContactStatusDto {
  @IsBoolean()
  isResolved: boolean;
}