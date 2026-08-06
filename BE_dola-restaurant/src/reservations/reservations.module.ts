import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Reservation } from './entities/reservation.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsPublicController } from './public-reservations.controller';
import { UserReservationsController } from './user-reservations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation]), JwtModule],
  controllers: [
    ReservationsController,
    ReservationsPublicController,
    UserReservationsController,
  ],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}

