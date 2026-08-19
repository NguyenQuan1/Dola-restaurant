export type CheckoutMethod = 'cash' | 'card' | 'transfer';
export declare class CheckoutOrderDto {
    paymentMethod: CheckoutMethod;
}
