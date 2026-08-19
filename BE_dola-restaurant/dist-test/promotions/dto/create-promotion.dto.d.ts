export declare class CreatePromotionDto {
    title: string;
    type: string;
    code?: string;
    description?: string;
    conditions?: string;
    discountType?: 'percent' | 'fixed';
    discountValue: number;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
}
