"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutOrderDto = void 0;
const class_validator_1 = require("class-validator");
class CheckoutOrderDto {
    paymentMethod;
}
exports.CheckoutOrderDto = CheckoutOrderDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Phương thức thanh toán không được để trống' }),
    (0, class_validator_1.IsEnum)(['cash', 'card', 'transfer'], {
        message: 'Phương thức thanh toán phải là cash, card hoặc transfer',
    }),
    __metadata("design:type", String)
], CheckoutOrderDto.prototype, "paymentMethod", void 0);
//# sourceMappingURL=checkout-order.dto.js.map