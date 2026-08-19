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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contact_entity_1 = require("./entities/contact.entity");
let ContactsService = class ContactsService {
    contactRepo;
    constructor(contactRepo) {
        this.contactRepo = contactRepo;
    }
    async findAll(query = {}) {
        const page = Number(query.page) > 0 ? Number(query.page) : 1;
        const limit = Number(query.limit) > 0 ? Number(query.limit) : 50;
        const where = {};
        if (query.search) {
            where.fullName = (0, typeorm_2.ILike)(`%${query.search}%`);
        }
        if (query.isResolved !== undefined) {
            where.isResolved = query.isResolved;
        }
        const [items, total] = await this.contactRepo.findAndCount({
            where,
            order: { createdAt: 'DESC', id: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit };
    }
    async findOne(id) {
        const contact = await this.contactRepo.findOne({ where: { id } });
        if (!contact) {
            throw new common_1.NotFoundException('Không tìm thấy liên hệ');
        }
        return contact;
    }
    async create(dto) {
        const contact = this.contactRepo.create({
            fullName: dto.fullName.trim(),
            email: dto.email.trim(),
            phone: dto.phone.trim(),
            subject: dto.subject?.trim() || null,
            message: dto.message.trim(),
            isResolved: false,
        });
        return this.contactRepo.save(contact);
    }
    async toggleResolved(id, isResolved) {
        const contact = await this.findOne(id);
        contact.isResolved = isResolved;
        return this.contactRepo.save(contact);
    }
    async remove(id) {
        const contact = await this.findOne(id);
        await this.contactRepo.remove(contact);
        return { success: true };
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contact_entity_1.Contact)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map