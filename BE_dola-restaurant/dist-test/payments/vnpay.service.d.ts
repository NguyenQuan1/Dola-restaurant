import { ConfigService } from '@nestjs/config';
export interface VnpayInitParams {
    orderId: number;
    orderCode: string;
    amount: number;
    orderInfo: string;
    clientIp: string;
    locale?: 'vn' | 'en';
}
export interface VnpayCallbackQuery {
    vnp_TmnCode?: string;
    vnp_Amount?: string;
    vnp_BankCode?: string;
    vnp_BankTranNo?: string;
    vnp_CardType?: string;
    vnp_PayDate?: string;
    vnp_OrderInfo?: string;
    vnp_TransactionNo?: string;
    vnp_ResponseCode?: string;
    vnp_TransactionStatus?: string;
    vnp_TxnRef?: string;
    vnp_SecureHashType?: string;
    vnp_SecureHash?: string;
    [key: string]: string | undefined;
}
export declare class VnpayService {
    private readonly configService;
    private readonly logger;
    private readonly tmnCode;
    private readonly hashSecret;
    private readonly vnpUrl;
    private readonly returnUrl;
    constructor(configService: ConfigService);
    createPaymentUrl(params: VnpayInitParams): string;
    verifyCallback(query: VnpayCallbackQuery): boolean;
    extractOrderId(txnRef: string): number;
    private getDateString;
    private sortObject;
}
