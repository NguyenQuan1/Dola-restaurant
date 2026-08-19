export type PromotionStatus = 'draft' | 'ongoing' | 'paused' | 'expired';
export type PromotionDiscountType = 'percent' | 'fixed';
export declare class Promotion {
    id: number;
    title: string;
    type: string;
    code: string | null;
    description: string | null;
    conditions: string | null;
    discountType: PromotionDiscountType;
    discountValue: number;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    status: PromotionStatus;
    notifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
