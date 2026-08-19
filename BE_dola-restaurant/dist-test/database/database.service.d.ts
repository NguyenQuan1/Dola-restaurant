import { OnModuleInit } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
export declare class DatabaseService implements OnModuleInit {
    private connection;
    onModuleInit(): Promise<void>;
    getConnection(): Promise<mysql.Pool>;
}
