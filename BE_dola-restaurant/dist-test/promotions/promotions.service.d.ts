import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Promotion, PromotionStatus } from './entities/promotion.entity';
import { User } from '../auth/entities/user.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
export interface FindAllPromotionsQuery {
    search?: string;
    status?: PromotionStatus;
    page?: number;
    limit?: number;
}
export declare class PromotionsService {
    private readonly promotionRepo;
    private readonly userRepo;
    private readonly configService;
    private readonly logger;
    private transporter;
    constructor(promotionRepo: Repository<Promotion>, userRepo: Repository<User>, configService: ConfigService);
    findAll(query?: FindAllPromotionsQuery): Promise<{
        items: Promotion[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<Promotion>;
    create(dto: CreatePromotionDto): Promise<Promotion>;
    update(id: number, dto: UpdatePromotionDto): Promise<Promotion>;
    changeStatus(id: number, nextStatus: PromotionStatus): Promise<Promotion>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    expireOverduePromotions(): Promise<{
        expiredCount: number;
    }>;
    private assertDateRangeValid;
    private normalizeCode;
    private saveWithUniqueCode;
    private notifyCustomers;
    private getCustomerEmails;
    private getTransporter;
    private sendPromotionMail;
}
