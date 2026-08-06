import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PromotionsService } from './promotions.service';

// Quét định kỳ để tự động chuyển các khuyến mãi đã quá end_date/end_time
// sang 'expired'. Việc chuyển draft -> ongoing vẫn do admin bấm tay
// (xem PromotionsController.changeStatus).
@Injectable()
export class PromotionsCron {
  private readonly logger = new Logger(PromotionsCron.name);

  constructor(private readonly promotionsService: PromotionsService) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpirePromotions() {
    const result = await this.promotionsService.expireOverduePromotions();
    if (result.expiredCount > 0) {
      this.logger.log(`Đã tự động chuyển ${result.expiredCount} khuyến mãi sang trạng thái hết hạn`);
    }
  }
}
