import { Body, Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReservationsService } from './reservations.service';
import { CancelReservationDto } from './dto/cancel-reservation.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('user/reservations')
export class UserReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  findMyReservations(@Req() req: any) {
    return this.reservationsService.findUserReservations(req.user.userId);
  }

  @Patch(':id/cancel')
  cancelMyReservation(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CancelReservationDto>,
  ) {
    return this.reservationsService.cancel(id, dto.reason, 'customer', req.user.userId);
  }
}
