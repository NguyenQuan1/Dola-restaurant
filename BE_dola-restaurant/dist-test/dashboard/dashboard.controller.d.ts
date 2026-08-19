import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
}
