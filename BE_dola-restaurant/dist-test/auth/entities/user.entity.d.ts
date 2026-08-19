import { Role } from './role.entity';
export declare class User {
    id: number;
    roleId: number;
    fullName: string;
    email: string;
    phone: string;
    passwordHash: string;
    avatarUrl: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    role: Role;
}
