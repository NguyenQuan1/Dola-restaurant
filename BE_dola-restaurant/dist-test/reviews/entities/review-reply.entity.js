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
exports.ReviewReply = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../auth/entities/user.entity");
const review_entity_1 = require("./review.entity");
let ReviewReply = class ReviewReply {
    id;
    reviewId;
    review;
    userId;
    user;
    replyText;
    createdAt;
    updatedAt;
};
exports.ReviewReply = ReviewReply;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ReviewReply.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'review_id' }),
    __metadata("design:type", Number)
], ReviewReply.prototype, "reviewId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => review_entity_1.Review, (review) => review.replies, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'review_id' }),
    __metadata("design:type", review_entity_1.Review)
], ReviewReply.prototype, "review", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], ReviewReply.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ReviewReply.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reply_text', type: 'text' }),
    __metadata("design:type", String)
], ReviewReply.prototype, "replyText", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ReviewReply.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ReviewReply.prototype, "updatedAt", void 0);
exports.ReviewReply = ReviewReply = __decorate([
    (0, typeorm_1.Entity)('review_replies')
], ReviewReply);
//# sourceMappingURL=review-reply.entity.js.map