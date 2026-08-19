export interface PromotionMailData {
    title: string;
    type: string;
    code?: string | null;
    description?: string | null;
    conditions?: string | null;
    discountType: 'percent' | 'fixed';
    discountValue: number | string;
    startDate: string;
    endDate: string;
    startTime?: string | null;
    endTime?: string | null;
}
export declare function buildPromotionMailText(promotion: PromotionMailData): string;
export declare function buildPromotionMailHtml(promotion: PromotionMailData, ctaUrl?: string): string;
