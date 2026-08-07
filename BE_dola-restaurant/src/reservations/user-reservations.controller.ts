import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReservationsService } from './reservations.service';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('user/reservations')
export class UserReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  findMyReservations(@CurrentUser('userId') userId: number) {
    return this.reservationsService.findUserReservations(userId);
  }

  @Patch(':id/cancel')
  cancelMyReservation(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelReservationDto,
  ) {
    return this.reservationsService.cancel(id, dto.reason, 'customer', userId);
  }
}
