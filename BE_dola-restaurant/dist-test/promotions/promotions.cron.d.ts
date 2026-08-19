import { PromotionsService } from './promotions.service';
export declare class PromotionsCron {
    private readonly promotionsService;
    private readonly logger;
    constructor(promotionsService: PromotionsService);
    handleExpirePromotions(): Promise<void>;
}
