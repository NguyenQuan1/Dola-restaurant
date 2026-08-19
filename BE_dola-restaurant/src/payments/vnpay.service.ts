import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface VnpayInitParams {
  orderId: number;
  amount: number;
  orderInfo: string;
  clientIp?: string;
  locale?: string;
}

export interface VnpayCallbackQuery {
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode?: string;
  vnp_TmnCode?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionStatus?: string;
  vnp_TxnRef?: string;
  vnp_SecureHashType?: string;
  vnp_SecureHash?: string;
  [key: string]: any;
}

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);

  private tmnCode: string;
  private hashSecret: string;
  private vnpUrl: string;
  private returnUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') ?? '';
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') ?? '';
    this.vnpUrl =
      this.configService.get<string>('VNPAY_URL') ??
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL') ??
      'http://localhost:3000/orders/vnpay-callback';
  }

  /**
   * Tạo URL thanh toán VNPay chuẩn v2.1.0 với chữ ký SHA512.
   */
  createPaymentUrl(params: VnpayInitParams): string {
    const createDate = this.getDateString();
    // Mã giao dịch: ID đơn hàng + timestamp để đảm bảo tính duy nhất khi thanh toán lại
    const txnRef = `${params.orderId}-${Date.now()}`;

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: String(Math.round(params.amount) * 100), // VNPay yêu cầu nhân 100
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: params.clientIp || '127.0.0.1',
      vnp_Locale: params.locale ?? 'vn',
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: this.returnUrl,
      vnp_TxnRef: txnRef,
    };

    const sorted = this.sortObject(vnpParams);
    const signData = new URLSearchParams(sorted).toString();
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const paymentUrl = `${this.vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
    this.logger.log(`VNPay URL created for order ${params.orderId} (txnRef=${txnRef})`);
    return paymentUrl;
  }

  /**
   * Xác thực chữ ký HMAC-SHA512 từ VNPay callback / IPN.
   */
  verifyCallback(query: VnpayCallbackQuery): boolean {
    const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query;
    if (!vnp_SecureHash) return false;

    const filtered: Record<string, string> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined && value !== null && value !== '') {
        filtered[key] = String(value);
      }
    }

    const sorted = this.sortObject(filtered);
    const signData = new URLSearchParams(sorted).toString();
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = checkHash.toLowerCase() === vnp_SecureHash.toLowerCase();
    if (!isValid) {
      this.logger.warn(`VNPay checksum verification failed for TxnRef: ${query.vnp_TxnRef}`);
    }
    return isValid;
  }

  /**
   * Trích xuất ID đơn hàng từ txnRef (dạng "orderId-timestamp").
   */
  extractOrderId(txnRef: string): number {
    return Number(txnRef.split('-')[0]);
  }

  private getDateString(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    );
  }

  private sortObject(obj: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== '' && v !== undefined && v !== null)
        .sort(([a], [b]) => a.localeCompare(b)),
    );
  }
}
