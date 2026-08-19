import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ChangePromotionStatusDto } from './dto/change-status.dto';
import type { PromotionStatus } from './entities/promotion.entity';
export declare class PromotionsController {
    private readonly promotionsService;
    constructor(promotionsService: PromotionsService);
    findAll(search?: string, status?: PromotionStatus, page?: string, limit?: string): Promise<{
        items: import("./entities/promotion.entity").Promotion[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/promotion.entity").Promotion>;
    create(dto: CreatePromotionDto): Promise<import("./entities/promotion.entity").Promotion>;
    update(id: number, dto: UpdatePromotionDto): Promise<import("./entities/promotion.entity").Promotion>;
    changeStatus(id: number, dto: ChangePromotionStatusDto): Promise<import("./entities/promotion.entity").Promotion>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
