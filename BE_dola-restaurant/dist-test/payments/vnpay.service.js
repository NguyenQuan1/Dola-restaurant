"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VnpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VnpayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
let VnpayService = VnpayService_1 = class VnpayService {
    configService;
    logger = new common_1.Logger(VnpayService_1.name);
    tmnCode;
    hashSecret;
    vnpUrl;
    returnUrl;
    constructor(configService) {
        this.configService = configService;
        this.tmnCode = this.configService.get('VNPAY_TMN_CODE') ?? '';
        this.hashSecret = this.configService.get('VNPAY_HASH_SECRET') ?? '';
        this.vnpUrl =
            this.configService.get('VNPAY_URL') ??
                'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        this.returnUrl =
            this.configService.get('VNPAY_RETURN_URL') ??
                'http://localhost:3000/api/orders/vnpay-callback';
    }
    createPaymentUrl(params) {
        const createDate = this.getDateString();
        const txnRef = `${params.orderId}-${Date.now()}`;
        const vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: this.tmnCode,
            vnp_Amount: String(Math.round(params.amount) * 100),
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
    verifyCallback(query) {
        const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query;
        if (!vnp_SecureHash)
            return false;
        const sorted = this.sortObject(Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)));
        const signData = new URLSearchParams(sorted).toString();
        const hmac = crypto.createHmac('sha512', this.hashSecret);
        const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        return checkHash === vnp_SecureHash;
    }
    extractOrderId(txnRef) {
        return Number(txnRef.split('-')[0]);
    }
    getDateString() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return (`${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
            `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`);
    }
    sortObject(obj) {
        return Object.fromEntries(Object.entries(obj)
            .filter(([, v]) => v !== '' && v !== undefined && v !== null)
            .sort(([a], [b]) => a.localeCompare(b)));
    }
};
exports.VnpayService = VnpayService;
exports.VnpayService = VnpayService = VnpayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VnpayService);
//# sourceMappingURL=vnpay.service.js.map