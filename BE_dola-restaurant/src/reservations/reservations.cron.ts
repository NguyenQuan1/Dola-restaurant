import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationsService } from './reservations.service';

@Injectable()
export class ReservationsCron {
  private readonly logger = new Logger(ReservationsCron.name);

  constructor(private readonly reservationsService: ReservationsService) {}

  // Quét định kỳ 5 phút/lần để gửi mail nhắc nhở đặt bàn trước 4 giờ
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSendReservationReminders() {
    const result = await this.reservationsService.sendUpcomingReservationReminders();
    if (result.sentCount > 0) {
      this.logger.log(`Đã gửi ${result.sentCount} email nhắc nhở đặt bàn trước 4 giờ.`);
    }
  }
}
