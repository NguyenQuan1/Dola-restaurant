import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Reservation } from './entities/reservation.entity';
import { Table } from '../tables/entities/table.entity';
import { Order } from '../orders/entities/order.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsPublicController } from './public-reservations.controller';
import { UserReservationsController } from './user-reservations.controller';
import { ReservationsCron } from './reservations.cron';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Table, Order]), JwtModule],
  controllers: [
    ReservationsController,
    ReservationsPublicController,
    UserReservationsController,
  ],
  providers: [ReservationsService, ReservationsCron],
  exports: [ReservationsService],
})
export class ReservationsModule {}

