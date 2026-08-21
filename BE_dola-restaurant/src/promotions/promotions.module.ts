import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from './entities/promotion.entity';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { PromotionsPublicController } from './public-promotions.controller';
import { PromotionsCron } from './promotions.cron';
import { MailModule } from '../mail/mail.module';

// Đăng ký thêm User, Role (đã có ở AuthModule) vì PromotionsService cần
// query trực tiếp danh sách user role 'customer' để gửi mail — không đi qua
// AuthService vì AuthService chỉ export các nghiệp vụ auth, không có sẵn hàm
// lọc theo role phù hợp cho việc gửi mail hàng loạt.
@Module({
  imports: [TypeOrmModule.forFeature([Promotion, User, Role]), MailModule],
  // PromotionsController: yêu cầu đăng nhập (admin/staff) — CRUD + đổi trạng thái.
  // PromotionsPublicController: không guard — trang user chỉ đọc khuyến mãi 'ongoing'.
  controllers: [PromotionsController, PromotionsPublicController],
  providers: [PromotionsService, PromotionsCron],
  exports: [PromotionsService],
})
export class PromotionsModule {}