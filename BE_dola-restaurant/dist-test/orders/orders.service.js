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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
const table_entity_1 = require("../tables/entities/table.entity");
const food_entity_1 = require("../foods/entities/food.entity");
const orders_gateway_1 = require("./orders.gateway");
const vnpay_service_1 = require("../payments/vnpay.service");
let OrdersService = class OrdersService {
    orderRepository;
    orderItemRepository;
    tableRepository;
    foodRepository;
    ordersGateway;
    vnpayService;
    constructor(orderRepository, orderItemRepository, tableRepository, foodRepository, ordersGateway, vnpayService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.tableRepository = tableRepository;
        this.foodRepository = foodRepository;
        this.ordersGateway = ordersGateway;
        this.vnpayService = vnpayService;
    }
    async createDineInOrder(dto) {
        const table = await this.tableRepository.findOne({
            where: { code: dto.tableCode },
        });
        if (!table) {
            throw new common_1.NotFoundException(`Không tìm thấy bàn có mã "${dto.tableCode}"`);
        }
        const foodIds = dto.items.map((item) => item.foodId);
        const foods = await this.foodRepository.find({
            where: { id: (0, typeorm_2.In)(foodIds) },
        });
        const foodMap = new Map(foods.map((f) => [f.id, f]));
        for (const itemDto of dto.items) {
            if (!foodMap.has(itemDto.foodId)) {
                throw new common_1.BadRequestException(`Món ăn với ID ${itemDto.foodId} không tồn tại`);
            }
        }
        let activeOrder = await this.orderRepository.findOne({
            where: {
                tableId: table.id,
                status: (0, typeorm_2.In)(['pending', 'confirmed', 'preparing', 'served']),
            },
            relations: ['orderItems', 'orderItems.food', 'table'],
        });
        if (activeOrder) {
            for (const itemDto of dto.items) {
                const food = foodMap.get(itemDto.foodId);
                const newItem = this.orderItemRepository.create({
                    orderId: activeOrder.id,
                    foodId: food.id,
                    quantity: itemDto.quantity,
                    price: Number(food.price),
                    note: itemDto.note || null,
                    status: 'pending',
                });
                await this.orderItemRepository.save(newItem);
            }
            const updatedItems = await this.orderItemRepository.find({
                where: { orderId: activeOrder.id },
            });
            const totalAmount = updatedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
            activeOrder.totalAmount = totalAmount;
            if (dto.note) {
                activeOrder.note = activeOrder.note
                    ? `${activeOrder.note} | ${dto.note}`
                    : dto.note;
            }
            activeOrder = await this.orderRepository.save(activeOrder);
            if (table.status !== 'occupied') {
                table.status = 'occupied';
                await this.tableRepository.save(table);
            }
            const fullOrder = await this.findOne(activeOrder.id);
            this.ordersGateway.notifyOrderUpdated(fullOrder);
            return fullOrder;
        }
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderCode = `ORD-${dateStr}-${randomSuffix}`;
        let totalAmount = 0;
        const newItems = [];
        for (const itemDto of dto.items) {
            const food = foodMap.get(itemDto.foodId);
            const itemPrice = Number(food.price);
            totalAmount += itemPrice * itemDto.quantity;
            const orderItem = this.orderItemRepository.create({
                foodId: food.id,
                quantity: itemDto.quantity,
                price: itemPrice,
                note: itemDto.note || null,
                status: 'pending',
            });
            newItems.push(orderItem);
        }
        const newOrder = this.orderRepository.create({
            code: orderCode,
            tableId: table.id,
            customerName: dto.customerName || null,
            customerPhone: dto.customerPhone || null,
            type: 'dine_in',
            status: 'pending',
            paymentStatus: 'unpaid',
            totalAmount,
            note: dto.note || null,
            orderItems: newItems,
        });
        const savedOrder = await this.orderRepository.save(newOrder);
        table.status = 'occupied';
        await this.tableRepository.save(table);
        const fullOrder = await this.findOne(savedOrder.id);
        this.ordersGateway.notifyNewOrder(fullOrder);
        return fullOrder;
    }
    async getActiveOrderByTableCode(tableCode) {
        const table = await this.tableRepository.findOne({
            where: { code: tableCode },
        });
        if (!table) {
            throw new common_1.NotFoundException(`Không tìm thấy bàn có mã "${tableCode}"`);
        }
        const activeOrder = await this.orderRepository.findOne({
            where: {
                tableId: table.id,
                status: (0, typeorm_2.In)(['pending', 'confirmed', 'preparing', 'served']),
            },
            relations: ['table', 'orderItems', 'orderItems.food'],
            order: { createdAt: 'DESC' },
        });
        return activeOrder;
    }
    async findAll(query) {
        const qb = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.table', 'table')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.orderItems', 'orderItem')
            .leftJoinAndSelect('orderItem.food', 'food')
            .orderBy('order.createdAt', 'DESC');
        if (query?.status) {
            qb.andWhere('order.status = :status', { status: query.status });
        }
        if (query?.tableId) {
            qb.andWhere('order.tableId = :tableId', { tableId: query.tableId });
        }
        if (query?.type) {
            qb.andWhere('order.type = :type', { type: query.type });
        }
        if (query?.date) {
            qb.andWhere('DATE(order.createdAt) = :date', { date: query.date });
        }
        return qb.getMany();
    }
    async findOne(id) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['table', 'user', 'orderItems', 'orderItems.food'],
        });
        if (!order) {
            throw new common_1.NotFoundException(`Không tìm thấy đơn hàng #${id}`);
        }
        return order;
    }
    async updateStatus(id, dto) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['table'],
        });
        if (!order) {
            throw new common_1.NotFoundException(`Không tìm thấy đơn hàng #${id}`);
        }
        order.status = dto.status;
        const savedOrder = await this.orderRepository.save(order);
        if ((dto.status === 'completed' || dto.status === 'cancelled') &&
            order.tableId) {
            const remainingActive = await this.orderRepository.count({
                where: {
                    tableId: order.tableId,
                    status: (0, typeorm_2.In)(['pending', 'confirmed', 'preparing', 'served']),
                },
            });
            if (remainingActive === 0) {
                const table = await this.tableRepository.findOne({
                    where: { id: order.tableId },
                });
                if (table && table.status === 'occupied') {
                    table.status = 'available';
                    await this.tableRepository.save(table);
                }
            }
        }
        const fullOrder = await this.findOne(id);
        this.ordersGateway.notifyOrderUpdated(fullOrder);
        return fullOrder;
    }
    async updatePayment(id, dto) {
        const order = await this.findOne(id);
        order.paymentStatus = dto.paymentStatus;
        if (dto.paymentMethod) {
            order.paymentMethod = dto.paymentMethod;
        }
        const saved = await this.orderRepository.save(order);
        this.ordersGateway.notifyOrderUpdated(saved);
        return saved;
    }
    async checkout(id, dto) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['table'],
        });
        if (!order)
            throw new common_1.NotFoundException(`Không tìm thấy đơn hàng #${id}`);
        if (order.paymentStatus === 'paid') {
            throw new common_1.BadRequestException('Đơn hàng này đã được thanh toán trước đó');
        }
        if (order.status === 'completed' || order.status === 'cancelled') {
            throw new common_1.BadRequestException(`Không thể thanh toán đơn hàng có trạng thái "${order.status}"`);
        }
        order.paymentStatus = 'paid';
        order.paymentMethod = dto.paymentMethod;
        order.status = 'completed';
        await this.orderRepository.save(order);
        await this.releaseTableIfIdle(order.tableId);
        const fullOrder = await this.findOne(id);
        this.ordersGateway.notifyCheckout(fullOrder);
        return fullOrder;
    }
    async initVnpay(id, clientIp) {
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException(`Không tìm thấy đơn hàng #${id}`);
        if (order.paymentStatus === 'paid') {
            throw new common_1.BadRequestException('Đơn hàng này đã được thanh toán trước đó');
        }
        if (order.status === 'completed' || order.status === 'cancelled') {
            throw new common_1.BadRequestException(`Không thể thanh toán đơn hàng có trạng thái "${order.status}"`);
        }
        const paymentUrl = this.vnpayService.createPaymentUrl({
            orderId: order.id,
            orderCode: order.code,
            amount: Number(order.totalAmount),
            orderInfo: `Thanh toan don hang ${order.code}`,
            clientIp,
        });
        return { paymentUrl };
    }
    async handleVnpayCallback(query) {
        const isValid = this.vnpayService.verifyCallback(query);
        if (!isValid) {
            return { success: false, order: null, message: 'Chữ ký không hợp lệ' };
        }
        if (query.vnp_ResponseCode !== '00') {
            return {
                success: false,
                order: null,
                message: `Thanh toán thất bại (mã lỗi VNPay: ${query.vnp_ResponseCode})`,
            };
        }
        const orderId = this.vnpayService.extractOrderId(query.vnp_TxnRef ?? '');
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['table'],
        });
        if (!order) {
            return { success: false, order: null, message: `Không tìm thấy đơn hàng #${orderId}` };
        }
        if (order.paymentStatus === 'paid') {
            const fullOrder = await this.findOne(orderId);
            return { success: true, order: fullOrder, message: 'Đơn hàng đã được thanh toán' };
        }
        order.paymentStatus = 'paid';
        order.paymentMethod = 'vnpay';
        order.status = 'completed';
        await this.orderRepository.save(order);
        await this.releaseTableIfIdle(order.tableId);
        const fullOrder = await this.findOne(orderId);
        this.ordersGateway.notifyCheckout(fullOrder);
        return { success: true, order: fullOrder, message: 'Thanh toán thành công' };
    }
    async releaseTableIfIdle(tableId) {
        if (!tableId)
            return;
        const remainingActive = await this.orderRepository.count({
            where: {
                tableId,
                status: (0, typeorm_2.In)(['pending', 'confirmed', 'preparing', 'served']),
            },
        });
        if (remainingActive === 0) {
            const table = await this.tableRepository.findOne({ where: { id: tableId } });
            if (table && table.status === 'occupied') {
                table.status = 'available';
                await this.tableRepository.save(table);
            }
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(table_entity_1.Table)),
    __param(3, (0, typeorm_1.InjectRepository)(food_entity_1.Food)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        orders_gateway_1.OrdersGateway,
        vnpay_service_1.VnpayService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map