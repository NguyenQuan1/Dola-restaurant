import { Repository } from 'typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Review } from '../reviews/entities/review.entity';
import { Food } from '../foods/entities/food.entity';
import { User } from '../auth/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
export declare class DashboardService {
    private readonly reservationRepo;
    private readonly reviewRepo;
    private readonly foodRepo;
    private readonly userRepo;
    private readonly contactRepo;
    constructor(reservationRepo: Repository<Reservation>, reviewRepo: Repository<Review>, foodRepo: Repository<Food>, userRepo: Repository<User>, contactRepo: Repository<Contact>);
    getStats(): Promise<{
        stats: {
            todayReservations: number;
            pendingReservations: number;
            totalReviews: number;
            pendingReviews: number;
            activeFood: number;
            totalCustomers: number;
            pendingContacts: number;
        };
        reservationsByDay: {
            day: string;
            date: string;
            count: number;
        }[];
        recentReservations: {
            id: number;
            customerName: string;
            partySize: number;
            reservationDate: string;
            reservationTime: string;
            status: import("../reservations/entities/reservation.entity").ReservationStatus;
        }[];
        recentReviews: {
            id: number;
            rating: number;
            comment: string;
            foodName: any;
            userName: any;
            isApproved: boolean;
            createdAt: Date;
        }[];
        topFoods: {
            id: number;
            name: string;
            avgRating: number;
            price: number;
        }[];
    }>;
    private getReservationLast7Days;
}
