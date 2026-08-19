import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsInt()
  @Min(1)
  floor: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsEnum(['rect', 'circle'])
  @IsOptional()
  shape?: 'rect' | 'circle';

  @IsInt()
  @IsOptional()
  x?: number;

  @IsInt()
  @IsOptional()
  y?: number;

  @IsInt()
  @IsOptional()
  col?: number;

  @IsInt()
  @IsOptional()
  row?: number;

  @IsInt()
  @IsOptional()
  colSpan?: number;

  @IsEnum(['available', 'reserved', 'occupied'])
  @IsOptional()
  status?: 'available' | 'reserved' | 'occupied';
}
