import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Review } from '../reviews/entities/review.entity';
import { Food } from '../foods/entities/food.entity';
import { User } from '../auth/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Food)
    private readonly foodRepo: Repository<Food>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  async getStats() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Đặt bàn hôm nay
    const todayReservations = await this.reservationRepo.count({
      where: { reservationDate: todayStr },
    });

    // Đặt bàn đang chờ xác nhận
    const pendingReservations = await this.reservationRepo.count({
      where: { status: 'pending' },
    });

    // Tổng đánh giá
    const totalReviews = await this.reviewRepo.count();

    // Tổng đánh giá chưa phê duyệt
    const pendingReviews = await this.reviewRepo.count({
      where: { isApproved: false },
    });

    // Tổng món đang active
    const activeFood = await this.foodRepo.count({
      where: { isActive: true },
    });

    // Tổng khách hàng
    const totalCustomers = await this.userRepo.count({
      where: { isActive: true },
    });

    // Liên hệ chưa xử lý
    const pendingContacts = await this.contactRepo.count({
      where: { isResolved: false },
    });

    // Đặt bàn 7 ngày gần đây
    const last7 = await this.getReservationLast7Days();

    // 5 đặt bàn mới nhất (pending + confirmed)
    const recentReservations = await this.reservationRepo.find({
      where: [{ status: 'pending' }, { status: 'confirmed' }],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // 5 đánh giá mới nhất (eager: true nên không cần relations)
    const recentReviews = await this.reviewRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Top 5 món ăn có rating cao nhất
    const topFoods = await this.foodRepo.find({
      where: { isActive: true },
      order: { avgRating: 'DESC' },
      take: 5,
      select: { id: true, name: true, avgRating: true, price: true },
    });

    return {
      stats: {
        todayReservations,
        pendingReservations,
        totalReviews,
        pendingReviews,
        activeFood,
        totalCustomers,
        pendingContacts,
      },
      reservationsByDay: last7,
      recentReservations: recentReservations.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        partySize: r.partySize,
        reservationDate: r.reservationDate,
        reservationTime: r.reservationTime,
        status: r.status,
      })),
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        foodName: (r as any).food?.name || '—',
        userName: (r as any).user?.fullName || 'Khách',
        isApproved: r.isApproved,
        createdAt: r.createdAt,
      })),
      topFoods: topFoods.map((f) => ({
        id: f.id,
        name: f.name,
        avgRating: f.avgRating,
        price: f.price,
      })),
    };
  }

  private async getReservationLast7Days() {
    const result: { day: string; date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = await this.reservationRepo.count({
        where: { reservationDate: dateStr },
      });
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      result.push({ day: label, date: dateStr, count });
    }
    return result;
  }
}
