import { PromotionsService } from './promotions.service';
export declare class PromotionsPublicController {
    private readonly promotionsService;
    constructor(promotionsService: PromotionsService);
    findAllOngoing(page?: string, limit?: string): Promise<{
        items: import("./entities/promotion.entity").Promotion[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/promotion.entity").Promotion | null>;
}
