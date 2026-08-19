import { DataSource } from 'typeorm';
export declare class TablesSeedController {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    seed(): Promise<{
        message: string;
        count: number;
    }>;
}
