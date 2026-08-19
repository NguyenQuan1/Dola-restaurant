import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '../tables/entities/table.entity';
import { Food } from '../foods/entities/food.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { PromotionsService } from '../promotions/promotions.service';
import { CreateDineInOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { ApplyVoucherDto, RemoveVoucherDto } from './dto/apply-voucher.dto';
import { OrdersGateway } from './orders.gateway';
import { User } from '../auth/entities/user.entity';
import { VnpayService, VnpayCallbackQuery } from '../payments/vnpay.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly promotionsService: PromotionsService,
    private readonly ordersGateway: OrdersGateway,
    private readonly vnpayService: VnpayService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Khách hàng quét mã QR tại bàn và tiến hành đặt món (Dine-in Order).
   */
  async createDineInOrder(dto: CreateDineInOrderDto): Promise<Order> {
    // 1. Lấy danh sách món ăn & kiểm tra tồn tại (không cần nằm trong transaction/lock)
    const foodIds = dto.items.map((item) => item.foodId);
    const foods = await this.foodRepository.find({
      where: { id: In(foodIds) },
    });
    const foodMap = new Map<number, Food>(foods.map((f) => [f.id, f]));

    for (const itemDto of dto.items) {
      if (!foodMap.has(itemDto.foodId)) {
        throw new BadRequestException(`Món ăn với ID ${itemDto.foodId} không tồn tại`);
      }
    }

    // 2-4. Toàn bộ phần "tìm bàn -> tìm đơn active -> gộp/tạo đơn" chạy trong
    // 1 transaction, khóa dòng Table bằng pessimistic_write. Nhờ đó khi nhiều
    // khách cùng bàn gửi order gần như đồng thời, các request sẽ được xử lý
    // TUẦN TỰ (request sau phải đợi request trước commit xong mới đọc được
    // trạng thái mới nhất) thay vì cùng đọc "chưa có đơn active" và tạo ra
    // 2 đơn riêng biệt cho cùng 1 bàn.
    const { orderId, isNewOrder } = await this.dataSource.transaction(
      async (manager) => {
        const tableRepo = manager.getRepository(Table);
        const orderRepo = manager.getRepository(Order);
        const orderItemRepo = manager.getRepository(OrderItem);

        // Khóa dòng bàn -> mọi request khác cho CÙNG bàn này phải đợi
        const table = await tableRepo
          .createQueryBuilder('table')
          .setLock('pessimistic_write')
          .where('table.code = :code', { code: dto.tableCode })
          .getOne();

        if (!table) {
          throw new NotFoundException(`Không tìm thấy bàn có mã "${dto.tableCode}"`);
        }

        // Kiểm tra xem bàn đã có đơn hàng nào đang hoạt động chưa
        // (đọc lại BÊN TRONG transaction, sau khi đã có lock, để đảm bảo
        // thấy được dữ liệu mới nhất do request trước vừa commit)
        let activeOrder = await orderRepo.findOne({
          where: {
            tableId: table.id,
            status: In(['pending', 'confirmed', 'preparing', 'served']),
          },
        });

        // Xác định userId & thông tin khách hàng từ JWT đã xác thực hoặc reservation của bàn
        let orderUserId = (dto as any).userId ?? null;
        let customerName = dto.customerName || null;
        let customerPhone = dto.customerPhone || null;

        if (table.currentReservationId) {
          const reservationRepo = manager.getRepository(Reservation);
          const reservation = await reservationRepo.findOne({
            where: { id: table.currentReservationId },
          });
          if (reservation) {
            if (!orderUserId && reservation.userId) orderUserId = reservation.userId;
            if (!customerPhone && reservation.phone) customerPhone = reservation.phone;
            if (!customerName && reservation.customerName) customerName = reservation.customerName;
          }
        }

        if (orderUserId && (!customerName || !customerPhone)) {
          const userRepo = manager.getRepository(User);
          const user = await userRepo.findOne({ where: { id: orderUserId } });
          if (user) {
            if (!customerName) customerName = user.fullName;
            if (!customerPhone && user.phone) customerPhone = user.phone;
          }
        }

        if (activeOrder) {
          // Gắn userId vào đơn active nếu trước đó chưa có mà khách vừa gọi món khi đã đăng nhập
          if (!activeOrder.userId && orderUserId) {
            activeOrder.userId = orderUserId;
          }
          if (!activeOrder.customerPhone && customerPhone) {
            activeOrder.customerPhone = customerPhone;
          }
          if (!activeOrder.customerName && customerName) {
            activeOrder.customerName = customerName;
          }

          // Nếu đã có đơn active -> Bổ sung món vào đơn hiện tại
          for (const itemDto of dto.items) {
            const food = foodMap.get(itemDto.foodId)!;
            const newItem = orderItemRepo.create({
              orderId: activeOrder.id,
              foodId: food.id,
              quantity: itemDto.quantity,
              price: Number(food.price),
              note: itemDto.note || null,
              status: 'pending',
            });
            await orderItemRepo.save(newItem);
          }

          // Cập nhật lại tổng tiền đơn hàng (loại trừ các món đã bị hủy)
          const updatedItems = await orderItemRepo.find({
            where: { orderId: activeOrder.id },
          });
          const totalAmount = updatedItems
            .filter((item) => item.status !== 'cancelled')
            .reduce(
              (sum, item) => sum + Number(item.price) * item.quantity,
              0,
            );
          activeOrder.totalAmount = totalAmount;

          // Nếu đơn đã có voucher, tính toán lại số tiền giảm theo tổng tiền mới
          let discountAmount = 0;
          let finalAmount = totalAmount;
          if (activeOrder.promotionCode) {
            try {
              const effectiveUserId = activeOrder.userId ?? orderUserId;
              const isReservation = !!table.currentReservationId;
              const calc = await this.promotionsService.validateAndCalculateVoucher(
                activeOrder.promotionCode,
                totalAmount,
                {
                  userId: effectiveUserId,
                  isReservation,
                  customerPhone: activeOrder.customerPhone || undefined,
                  isFirstOrder: true, // đơn hiện tại đang giữ voucher hợp lệ
                },
              );
              discountAmount = calc.discountAmount;
              finalAmount = calc.finalAmount;
              activeOrder.promotionId = calc.promotion.id;
            } catch {
              // Nếu tổng tiền mới không còn đủ điều kiện voucher, gỡ voucher
              activeOrder.promotionCode = null;
              activeOrder.promotionId = null;
              discountAmount = 0;
              finalAmount = totalAmount;
            }
          }
          activeOrder.discountAmount = discountAmount;
          activeOrder.finalAmount = finalAmount;

          if (dto.note) {
            activeOrder.note = activeOrder.note
              ? `${activeOrder.note} | ${dto.note}`
              : dto.note;
          }
          activeOrder = await orderRepo.save(activeOrder);

          // Cập nhật lại trạng thái bàn sang occupied nếu chưa có
          if (table.status !== 'occupied') {
            table.status = 'occupied';
            await tableRepo.save(table);
          }

          return { orderId: activeOrder.id, isNewOrder: false };
        }

        // Chưa có đơn -> Tạo đơn mới
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderCode = `ORD-${dateStr}-${randomSuffix}`;

        let totalAmount = 0;
        const newItems: OrderItem[] = [];

        for (const itemDto of dto.items) {
          const food = foodMap.get(itemDto.foodId)!;
          const itemPrice = Number(food.price);
          totalAmount += itemPrice * itemDto.quantity;

          const orderItem = orderItemRepo.create({
            foodId: food.id,
            quantity: itemDto.quantity,
            price: itemPrice,
            note: itemDto.note || null,
            status: 'pending',
          });
          newItems.push(orderItem);
        }

        const newOrder = orderRepo.create({
          code: orderCode,
          tableId: table.id,
          userId: orderUserId,
          customerName,
          customerPhone,
          type: 'dine_in',
          status: 'pending',
          paymentStatus: 'unpaid',
          totalAmount,
          discountAmount: 0,
          finalAmount: totalAmount,
          promotionCode: null,
          promotionId: null,
          note: dto.note || null,
          orderItems: newItems,
        });

        const savedOrder = await orderRepo.save(newOrder);

        // Đổi trạng thái bàn thành occupied (đang dùng)
        table.status = 'occupied';
        await tableRepo.save(table);

        return { orderId: savedOrder.id, isNewOrder: true };
      },
    );

    // Phát socket + trả kết quả SAU KHI transaction đã commit thành công
    const fullOrder = await this.findOne(orderId);
    if (isNewOrder) {
      this.ordersGateway.notifyNewOrder(fullOrder);
    } else {
      this.ordersGateway.notifyOrderUpdated(fullOrder);
    }
    return fullOrder;
  }

  /**
   * Áp dụng mã khuyến mãi / voucher cho đơn hàng đang hoạt động của bàn hoặc theo orderId.
   */
  async applyVoucher(dto: ApplyVoucherDto): Promise<Order> {
    let order: Order | null = null;
    if (dto.orderId) {
      order = await this.orderRepository.findOne({
        where: { id: dto.orderId },
        relations: ['table', 'orderItems', 'orderItems.food'],
      });
    } else if (dto.tableCode) {
      order = await this.getActiveOrderByTableCode(dto.tableCode);
    }

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng đang hoạt động để áp dụng mã giảm giá');
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new BadRequestException(`Không thể áp dụng mã cho đơn hàng đã ${order.status === 'completed' ? 'hoàn thành' : 'bị hủy'}`);
    }

    const totalAmount = Number(order.totalAmount) || 0;
    if (totalAmount <= 0) {
      throw new BadRequestException('Đơn hàng chưa có món ăn nào để áp dụng mã giảm giá');
    }

    // userId đã được xác thực từ JWT token bởi controller (OptionalJwtAuthGuard)
    const verifiedUserId = dto.userId ?? null;
    const isReservation = !!order.table?.currentReservationId;

    // Gắn userId và thông tin vào order nếu khách đã đăng nhập
    if (verifiedUserId && !order.userId) {
      order.userId = verifiedUserId;
    }

    // Nếu bàn có liên kết với đặt bàn (reservation), lấy thêm thông tin nếu đơn còn thiếu
    if (order.table?.currentReservationId) {
      const reservation = await this.reservationRepository.findOne({
        where: { id: order.table.currentReservationId },
      });
      if (reservation) {
        if (!order.userId && reservation.userId) order.userId = reservation.userId;
        if (!order.customerPhone && reservation.phone) order.customerPhone = reservation.phone;
        if (!order.customerName && reservation.customerName) order.customerName = reservation.customerName;
      }
    }

    // Xác định isFirstOrder dựa trên lịch sử đặt hàng và đặt bàn của user
    let isFirstOrder: boolean | undefined = undefined;
    if (verifiedUserId) {
      const userProfile = await this.userRepository.findOne({
        where: { id: verifiedUserId },
      });
      const registeredPhone = userProfile?.phone?.trim() || null;
      const registeredEmail = userProfile?.email?.trim() || null;

      // 1. Đếm đơn hàng completed trong bảng orders theo userId
      const countByUserId = await this.orderRepository.count({
        where: { userId: verifiedUserId, status: 'completed' as const },
      });

      // 2. Đếm đơn hàng completed theo số điện thoại đã đăng ký hoặc sđt trên đơn
      let countByPhone = 0;
      const phonesToCheck = Array.from(
        new Set([registeredPhone, order.customerPhone?.trim()].filter(Boolean) as string[]),
      );

      if (phonesToCheck.length > 0) {
        countByPhone = await this.orderRepository
          .createQueryBuilder('o')
          .where('o.status = :status', { status: 'completed' })
          .andWhere('o.customer_phone IN (:...phones)', { phones: phonesToCheck })
          .andWhere('(o.user_id IS NULL OR o.user_id != :userId)', { userId: verifiedUserId })
          .getCount();
      }

      // 3. Đếm lịch sử đặt bàn completed trong bảng reservations
      let countByReservation = await this.reservationRepository.count({
        where: { userId: verifiedUserId, status: 'completed' as const },
      });
      if (countByReservation === 0 && phonesToCheck.length > 0) {
        countByReservation = await this.reservationRepository
          .createQueryBuilder('r')
          .where('r.status = :status', { status: 'completed' })
          .andWhere('r.phone IN (:...phones)', { phones: phonesToCheck })
          .getCount();
      }
      if (countByReservation === 0 && registeredEmail) {
        countByReservation = await this.reservationRepository.count({
          where: { email: registeredEmail, status: 'completed' as const },
        });
      }

      const totalCompleted = countByUserId + countByPhone + countByReservation;
      isFirstOrder = totalCompleted === 0;
    }

    const { promotion, discountAmount, finalAmount } =
      await this.promotionsService.validateAndCalculateVoucher(
        dto.voucherCode,
        totalAmount,
        {
          userId: verifiedUserId ?? undefined,
          isReservation,
          customerPhone: order.customerPhone || undefined,
          isFirstOrder,
        },
      );

    order.promotionCode = promotion.code;
    order.promotionId = promotion.id;
    order.discountAmount = discountAmount;
    order.finalAmount = finalAmount;

    await this.orderRepository.save(order);

    const fullOrder = await this.findOne(order.id);
    this.ordersGateway.notifyOrderUpdated(fullOrder);
    return fullOrder;
  }

  /**
   * Hủy mã khuyến mãi đang áp dụng trên đơn hàng.
   */
  async removeVoucher(dto: RemoveVoucherDto): Promise<Order> {
    let order: Order | null = null;
    if (dto.orderId) {
      order = await this.orderRepository.findOne({
        where: { id: dto.orderId },
        relations: ['table', 'orderItems', 'orderItems.food'],
      });
    } else if (dto.tableCode) {
      order = await this.getActiveOrderByTableCode(dto.tableCode);
    }

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng để hủy mã giảm giá');
    }

    order.promotionCode = null;
    order.promotionId = null;
    order.discountAmount = 0;
    order.finalAmount = Number(order.totalAmount);

    await this.orderRepository.save(order);

    const fullOrder = await this.findOne(order.id);
    this.ordersGateway.notifyOrderUpdated(fullOrder);
    return fullOrder;
  }

  /**
   * Lấy đơn hàng active hiện tại của bàn qua mã bàn (phục vụ quét mã QR xem trạng thái gọi món).
   */
  async getActiveOrderByTableCode(tableCode: string): Promise<Order | null> {
    const table = await this.tableRepository.findOne({
      where: { code: tableCode },
    });
    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn có mã "${tableCode}"`);
    }

    const activeOrder = await this.orderRepository.findOne({
      where: {
        tableId: table.id,
        status: In(['pending', 'confirmed', 'preparing', 'served']),
      },
      relations: ['table', 'orderItems', 'orderItems.food'],
      order: { createdAt: 'DESC' },
    });

    return activeOrder;
  }

  /**
   * Lấy danh sách tất cả các đơn hàng cho Admin / Staff (hỗ trợ phân loại, lọc lịch sử).
   */
  async findAll(query?: {
    status?: string;
    tableId?: number;
    date?: string;
    startDate?: string;
    endDate?: string;
    type?: string;
    search?: string;
    paymentStatus?: string;
    paymentMethod?: string;
  }): Promise<Order[]> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.food', 'food')
      .leftJoinAndSelect('food.category', 'category')
      .orderBy('order.createdAt', 'DESC');

    if (query?.status) {
      // Hỗ trợ truyền nhiều status cách nhau bởi dấu phẩy, ví dụ:
      // ?status=pending,confirmed,preparing,served hoặc ?status=completed,cancelled
      const statuses = query.status
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (statuses.length > 1) {
        qb.andWhere('order.status IN (:...statuses)', { statuses });
      } else if (statuses.length === 1 && statuses[0] !== 'all') {
        qb.andWhere('order.status = :status', { status: statuses[0] });
      }
    }

    if (query?.tableId) {
      qb.andWhere('order.tableId = :tableId', { tableId: query.tableId });
    }

    if (query?.type && query.type !== 'all') {
      qb.andWhere('order.type = :type', { type: query.type });
    }

    if (query?.paymentStatus && query.paymentStatus !== 'all') {
      qb.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }

    if (query?.paymentMethod && query.paymentMethod !== 'all') {
      qb.andWhere('order.paymentMethod = :paymentMethod', {
        paymentMethod: query.paymentMethod,
      });
    }

    if (query?.date) {
      qb.andWhere('DATE(order.createdAt) = :date', { date: query.date });
    } else {
      if (query?.startDate) {
        qb.andWhere('DATE(order.createdAt) >= :startDate', {
          startDate: query.startDate,
        });
      }
      if (query?.endDate) {
        qb.andWhere('DATE(order.createdAt) <= :endDate', {
          endDate: query.endDate,
        });
      }
    }

    if (query?.search?.trim()) {
      const search = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(order.code) LIKE :search OR LOWER(order.customerName) LIKE :search OR order.customerPhone LIKE :search OR LOWER(table.code) LIKE :search)',
        { search },
      );
    }

    return qb.getMany();
  }

  /**
   * Hủy một món ăn cụ thể trong đơn hàng (khách đổi ý, đặt nhầm, hết món,...).
   * Tự động tính toán lại tổng tiền và voucher khuyến mãi tương ứng.
   */
  async cancelOrderItem(
    orderId: number,
    itemId: number,
    reason?: string,
  ): Promise<Order> {
    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);

      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: ['table'],
      });

      if (!order) {
        throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
      }

      if (order.status === 'completed' || order.status === 'cancelled') {
        throw new BadRequestException(
          `Không thể hủy món cho đơn hàng đã ${order.status === 'completed' ? 'hoàn thành' : 'bị hủy'}`,
        );
      }

      const item = await orderItemRepo.findOne({
        where: { id: itemId, orderId },
      });

      if (!item) {
        throw new NotFoundException(
          `Không tìm thấy món ăn #${itemId} trong đơn hàng #${orderId}`,
        );
      }

      if (item.status === 'cancelled') {
        throw new BadRequestException('Món ăn này đã được hủy trước đó');
      }

      // Đánh dấu món đã hủy
      item.status = 'cancelled';
      const cleanReason = reason?.trim();
      if (cleanReason) {
        item.note = item.note
          ? `${item.note} | [Hủy món: ${cleanReason}]`
          : `[Hủy món: ${cleanReason}]`;
      } else {
        item.note = item.note ? `${item.note} | [Đã hủy]` : `[Đã hủy]`;
      }
      await orderItemRepo.save(item);

      // Tính lại tổng tiền từ các món còn hiệu lực (status !== 'cancelled')
      const allItems = await orderItemRepo.find({
        where: { orderId },
      });
      const validItems = allItems.filter((i) => i.status !== 'cancelled');
      const newTotalAmount = validItems.reduce(
        (sum, i) => sum + Number(i.price) * i.quantity,
        0,
      );

      order.totalAmount = newTotalAmount;

      // Tính lại voucher nếu có
      if (order.promotionCode) {
        if (newTotalAmount <= 0) {
          order.promotionCode = null;
          order.promotionId = null;
          order.discountAmount = 0;
          order.finalAmount = 0;
        } else {
          try {
            const isReservation = !!order.table?.currentReservationId;
            const calc = await this.promotionsService.validateAndCalculateVoucher(
              order.promotionCode,
              newTotalAmount,
              {
                userId: order.userId || undefined,
                customerPhone: order.customerPhone || undefined,
                isReservation,
                isFirstOrder: true,
              },
            );
            order.discountAmount = calc.discountAmount;
            order.finalAmount = calc.finalAmount;
            order.promotionId = calc.promotion.id;
          } catch {
            // Nếu tổng tiền mới không còn đủ điều kiện voucher -> gỡ voucher
            order.promotionCode = null;
            order.promotionId = null;
            order.discountAmount = 0;
            order.finalAmount = newTotalAmount;
          }
        }
      } else {
        order.discountAmount = 0;
        order.finalAmount = newTotalAmount;
      }

      await orderRepo.save(order);
    });

    const fullOrder = await this.findOne(orderId);
    this.ordersGateway.notifyOrderUpdated(fullOrder);
    return fullOrder;
  }

  /**
   * Xem chi tiết 1 đơn hàng theo ID.
   */
  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['table', 'user', 'orderItems', 'orderItems.food'],
    });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
    }
    return order;
  }

  /**
   * Cập nhật trạng thái đơn hàng. Nếu chuyển sang completed/cancelled, tự động trả bàn về available nếu không còn đơn active.
   */
  async updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['table'],
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
    }

    order.status = dto.status;
    if (dto.status === 'cancelled') {
      order.paymentRequested = false;
    }
    const savedOrder = await this.orderRepository.save(order);

    // Kiểm tra nếu đơn hoàn thành hoặc bị hủy -> Cập nhật bàn
    if (
      (dto.status === 'completed' || dto.status === 'cancelled') &&
      order.tableId
    ) {
      const remainingActive = await this.orderRepository.count({
        where: {
          tableId: order.tableId,
          status: In(['pending', 'confirmed', 'preparing', 'served']),
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

  /**
   * Cập nhật thông tin thanh toán đơn hàng.
   */
  async updatePayment(id: number, dto: UpdateOrderPaymentDto): Promise<Order> {
    const order = await this.findOne(id);
    order.paymentStatus = dto.paymentStatus;
    if (dto.paymentMethod) {
      order.paymentMethod = dto.paymentMethod;
    }
    const saved = await this.orderRepository.save(order);
    this.ordersGateway.notifyOrderUpdated(saved);
    return saved;
  }

  // ─────────────────────────────────────────────────────
  // CHECKOUT — Thanh toán tích hợp
  // ─────────────────────────────────────────────────────

  /**
   * Nhân viên / admin thanh toán trực tiếp (tiền mặt, thẻ, chuyển khoản thông thường).
   * Một bước duy nhất: paid + completed + giải phóng bàn.
   * Sau khi hoàn tất, tự động đánh dấu reservation đang 'seated' của bàn đó
   * về 'completed' để đồng bộ lịch sử đặt bàn.
   */
  async checkout(id: number, dto: CheckoutOrderDto): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['table'],
    });
    if (!order) throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('Đơn hàng này đã được thanh toán trước đó');
    }
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new BadRequestException(
        `Không thể thanh toán đơn hàng có trạng thái "${order.status}"`,
      );
    }

    order.paymentStatus = 'paid';
    order.paymentMethod = dto.paymentMethod;
    order.status = 'completed';
    order.paymentRequested = false;

    // Đảm bảo finalAmount được gán chính xác
    if (order.finalAmount === undefined || order.finalAmount === null) {
      order.finalAmount = Math.max(0, Number(order.totalAmount) - Number(order.discountAmount || 0));
    }

    await this.orderRepository.save(order);

    // Tăng số lượt dùng voucher nếu đơn có áp dụng voucher
    if (order.promotionId) {
      await this.promotionsService.incrementUsedCount(order.promotionId);
    }

    // Giải phóng bàn nếu không còn order active
    await this.releaseTableIfIdle(order.tableId);

    // Sau khi bàn được giải phóng, tự động hoàn thành reservation đang
    // 'seated' của bàn đó để đồng bộ lịch sử đặt bàn.
    if (order.tableId) {
      const seatedReservation = await this.reservationRepository.findOne({
        where: { tableId: order.tableId, status: 'seated' },
      });
      if (seatedReservation) {
        seatedReservation.status = 'completed';
        await this.reservationRepository.save(seatedReservation);
      }
    }

    const fullOrder = await this.findOne(id);
    this.ordersGateway.notifyCheckout(fullOrder);
    return fullOrder;
  }

  /**
   * Khách bấm nút "Yêu cầu thanh toán" tại bàn.
   * Không xử lý thanh toán — chỉ đánh dấu đơn hàng và báo realtime cho
   * admin/staff để nhân viên chủ động tới bàn thu tiền (tiền mặt/thẻ/chuyển khoản).
   */
  async requestPayment(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['table'],
    });
    if (!order) throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('Đơn hàng này đã được thanh toán trước đó');
    }
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new BadRequestException(
        `Không thể yêu cầu thanh toán cho đơn hàng có trạng thái "${order.status}"`,
      );
    }

    order.paymentRequested = true;
    await this.orderRepository.save(order);

    const fullOrder = await this.findOne(id);
    this.ordersGateway.notifyPaymentRequested(fullOrder);
    return fullOrder;
  }

  // ─────────────────────────────────────────────────────
  // VNPAY INTEGRATION
  // ─────────────────────────────────────────────────────

  /**
   * Tạo URL thanh toán VNPay cho đơn hàng.
   */
  async initVnpay(
    id: number,
    clientIp?: string,
  ): Promise<{ paymentUrl: string; orderId: number; amount: number; code: string }> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['table'],
    });
    if (!order) throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('Đơn hàng này đã được thanh toán trước đó');
    }
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new BadRequestException(
        `Không thể thanh toán đơn hàng có trạng thái "${order.status}"`,
      );
    }

    const amount =
      order.finalAmount !== undefined && order.finalAmount !== null
        ? Number(order.finalAmount)
        : Math.max(0, Number(order.totalAmount) - Number(order.discountAmount || 0));

    if (amount <= 0) {
      throw new BadRequestException('Số tiền thanh toán phải lớn hơn 0');
    }

    const paymentUrl = this.vnpayService.createPaymentUrl({
      orderId: order.id,
      amount,
      orderInfo: `Thanh toan don hang #${order.code || order.id} Dola Restaurant`,
      clientIp,
    });

    return {
      paymentUrl,
      orderId: order.id,
      amount,
      code: order.code,
    };
  }

  /**
   * Xử lý callback sau khi khách hàng hoàn tất thanh toán trên VNPay.
   */
  async handleVnpayCallback(query: VnpayCallbackQuery): Promise<{
    success: boolean;
    order?: Order;
    message: string;
    alreadyPaid?: boolean;
    responseCode?: string;
  }> {
    const isValid = this.vnpayService.verifyCallback(query);
    if (!isValid) {
      return {
        success: false,
        message: 'Chữ ký VNPay không hợp lệ (Checksum failed)',
      };
    }

    if (query.vnp_ResponseCode !== '00') {
      return {
        success: false,
        responseCode: query.vnp_ResponseCode,
        message: `Thanh toán không thành công (mã lỗi VNPay: ${query.vnp_ResponseCode})`,
      };
    }

    const orderId = this.vnpayService.extractOrderId(query.vnp_TxnRef ?? '');
    if (!orderId) {
      return {
        success: false,
        message: 'Không xác định được mã đơn hàng từ giao dịch VNPay',
      };
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['table'],
    });

    if (!order) {
      return {
        success: false,
        message: `Không tìm thấy đơn hàng #${orderId}`,
      };
    }

    if (order.paymentStatus === 'paid') {
      return {
        success: true,
        order,
        alreadyPaid: true,
        message: 'Đơn hàng đã được thanh toán thành công trước đó',
      };
    }

    // Cập nhật trạng thái thanh toán thành công
    order.paymentStatus = 'paid';
    order.paymentMethod = 'vnpay';
    order.status = 'completed';
    order.paymentRequested = false;

    if (order.finalAmount === undefined || order.finalAmount === null) {
      order.finalAmount = Math.max(
        0,
        Number(order.totalAmount) - Number(order.discountAmount || 0),
      );
    }

    await this.orderRepository.save(order);

    // Tăng số lượt dùng voucher nếu đơn có áp dụng voucher
    if (order.promotionId) {
      await this.promotionsService.incrementUsedCount(order.promotionId);
    }

    // Giải phóng bàn nếu không còn order active
    await this.releaseTableIfIdle(order.tableId);

    // Hoàn tất reservation đang seated liên kết
    if (order.tableId) {
      const seatedReservation = await this.reservationRepository.findOne({
        where: { tableId: order.tableId, status: 'seated' },
      });
      if (seatedReservation) {
        seatedReservation.status = 'completed';
        await this.reservationRepository.save(seatedReservation);
      }
    }

    const fullOrder = await this.findOne(order.id);
    this.ordersGateway.notifyCheckout(fullOrder);
    this.ordersGateway.notifyOrderUpdated(fullOrder);

    return {
      success: true,
      order: fullOrder,
      message: 'Thanh toán đơn hàng qua VNPay thành công',
    };
  }

  // ─────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────

  /**
   * Giải phóng bàn về "available" nếu không còn đơn hàng active.
   */
  private async releaseTableIfIdle(tableId: number | null): Promise<void> {
    if (!tableId) return;
    const remainingActive = await this.orderRepository.count({
      where: {
        tableId,
        status: In(['pending', 'confirmed', 'preparing', 'served']),
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
}