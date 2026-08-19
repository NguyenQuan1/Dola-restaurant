import { User } from './user.entity';
export declare class Role {
    id: number;
    name: string;
    description: string;
    createdAt: Date;
    users: User[];
}
