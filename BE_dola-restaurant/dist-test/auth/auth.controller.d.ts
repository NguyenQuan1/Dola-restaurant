import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: number;
            email: string;
            fullName: string;
        };
        accessToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: number;
            email: string;
            fullName: string;
        };
        accessToken: string;
    }>;
    adminLogin(dto: LoginDto): Promise<{
        user: {
            id: number;
            email: string;
            fullName: string;
            role: string;
        };
        accessToken: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        code?: string | undefined;
        message: string;
    }>;
    verifyCode(dto: VerifyCodeDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        fullName: string;
        email: string;
        phone: string;
        role: string;
    }>;
    updateProfile(userId: number, dto: UpdateProfileDto): Promise<{
        id: number;
        fullName: string;
        email: string;
        phone: string;
        role: string;
    }>;
    changePassword(userId: number, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getHistory(userId: number): Promise<{
        reservations: {
            id: number;
            customerName: string;
            phone: string;
            email: string | null;
            date: string;
            time: string;
            guests: number;
            table: string | null;
            note: string | null;
            status: import("../reservations/entities/reservation.entity").ReservationStatus;
            cancelReason: string | null;
            cancelledBy: import("../reservations/entities/reservation.entity").ReservationCancelledBy | null;
            createdAt: Date;
        }[];
        orders: {
            id: string;
            date: string;
            total: number;
            status: string;
        }[];
    }>;
    getUsers(search?: string, role?: string, includeInactive?: string, page?: string, limit?: string): Promise<{
        id: number;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        isActive: boolean;
    }[] | {
        items: {
            id: number;
            fullName: string;
            email: string;
            phone: string;
            role: string;
            isActive: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUserById(id: number): Promise<{
        id: number;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        isActive: boolean;
    }>;
    toggleUserStatus(id: number, dto: {
        isActive: boolean;
    }): Promise<{
        message: string;
        id: number;
        isActive: boolean;
    }>;
    updateUser(id: number, dto: {
        fullName?: string;
        email?: string;
        phone?: string;
        role?: string;
    }): Promise<{
        id: number;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        isActive: boolean;
    }>;
    createStaff(dto: CreateStaffDto): Promise<{
        id: number;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        isActive: boolean;
    }>;
}
