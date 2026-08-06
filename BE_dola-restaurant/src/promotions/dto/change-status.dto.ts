import { IsIn } from 'class-validator';
import type { PromotionStatus } from '../entities/promotion.entity';

export class ChangePromotionStatusDto {
  @IsIn(['draft', 'ongoing', 'paused', 'expired'], {
    message: 'Trạng thái không hợp lệ',
  })
  status: PromotionStatus;
}