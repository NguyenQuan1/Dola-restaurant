import { Body, Controller, Post, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

// Route công khai cho trang khách hàng — KHÔNG @UseGuards, ai cũng gọi được.
@Controller('public/reservations')
export class ReservationsPublicController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  create(@Body() dto: CreateReservationDto, @Req() req: any) {
    let userId: number | undefined;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = this.jwtService.decode(token) as any;
        if (decoded?.sub || decoded?.userId) {
          userId = Number(decoded.sub || decoded.userId);
        }
      }
    } catch {
      // Bỏ qua lỗi token nếu có vì đây là public endpoint
    }

    return this.reservationsService.create(dto, false, userId);
  }
}

