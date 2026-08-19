export declare class CreateStaffDto {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    role: 'admin' | 'staff';
}
