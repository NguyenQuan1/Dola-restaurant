import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class ChangeTableStatusDto {
  @IsEnum(['available', 'reserved', 'occupied'])
  @IsNotEmpty()
  status: 'available' | 'reserved' | 'occupied';

  @IsInt()
  @IsOptional()
  reservationId?: number | null;

  @IsBoolean()
  @IsOptional()
  completeReservation?: boolean;
}
