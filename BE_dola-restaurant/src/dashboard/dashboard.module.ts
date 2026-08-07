import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Review } from '../reviews/entities/review.entity';
import { Food } from '../foods/entities/food.entity';
import { User } from '../auth/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Review, Food, User, Contact]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
