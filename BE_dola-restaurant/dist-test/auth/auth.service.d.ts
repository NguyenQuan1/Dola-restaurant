import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ReservationsService } from '../reservations/reservations.service';
export interface FindAllUsersQuery {
    search?: string;
    role?: string;
    includeInactive?: boolean;
    page?: number;
    limit?: number;
}
export declare class AuthService {
    private readonly userRepository;
    private readonly roleRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly reservationsService;
    private readonly codeStore;
    private readonly logger;
    constructor(userRepository: Repository<User>, roleRepository: Repository<Role>, jwtService: JwtService, configService: ConfigService, reservationsService: ReservationsService);
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
    private purgeExpiredCodes;
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
    updateProfile(userId: number, dto: any): Promise<{
        id: number;
        fullName: string;
        email: string;
        phone: string;
        role: string;
    }>;
    changePassword(userId: number, dto: any): Promise<{
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
    hashPassword(password: string): Promise<string>;
    private generateSixDigitCode;
    private isDevelopment;
    getUsers(query?: FindAllUsersQuery): Promise<{
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
    toggleUserStatus(userId: number, isActive: boolean): Promise<{
        message: string;
        id: number;
        isActive: boolean;
    }>;
    createStaffAccount(dto: CreateStaffDto): Promise<{
        id: number;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        isActive: boolean;
    }>;
    updateUserByAdmin(id: number, dto: {
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
    private sendMail;
}
