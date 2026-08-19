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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ChatbotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const foods_service_1 = require("../foods/foods.service");
const reservations_service_1 = require("../reservations/reservations.service");
const promotions_service_1 = require("../promotions/promotions.service");
const auth_service_1 = require("../auth/auth.service");
const chat_service_1 = require("../chat/chat.service");
const chat_gateway_1 = require("../chat/chat.gateway");
function removeAccents(str) {
    if (!str)
        return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
}
let ChatbotService = ChatbotService_1 = class ChatbotService {
    configService;
    foodsService;
    reservationsService;
    promotionsService;
    authService;
    chatService;
    chatGateway;
    logger = new common_1.Logger(ChatbotService_1.name);
    groq = null;
    GROQ_MODEL = 'llama-3.3-70b-versatile';
    constructor(configService, foodsService, reservationsService, promotionsService, authService, chatService, chatGateway) {
        this.configService = configService;
        this.foodsService = foodsService;
        this.reservationsService = reservationsService;
        this.promotionsService = promotionsService;
        this.authService = authService;
        this.chatService = chatService;
        this.chatGateway = chatGateway;
        const apiKey = this.configService.get('GROQ_API_KEY');
        if (apiKey) {
            this.groq = new groq_sdk_1.default({ apiKey });
        }
    }
    async callGroqWithRetry(params, retries = 1, delayMs = 3000) {
        try {
            return await this.groq.chat.completions.create(params);
        }
        catch (err) {
            const isRateLimit = err?.status === 429;
            const isToolUseFailed = err?.error?.error?.code === 'tool_use_failed' || err?.code === 'tool_use_failed';
            if (isRateLimit && retries > 0) {
                this.logger.warn(`Groq rate-limited, retry sau ${delayMs}ms (còn ${retries} lần thử)`);
                await new Promise((res) => setTimeout(res, delayMs));
                return this.callGroqWithRetry(params, retries - 1, delayMs);
            }
            if (isToolUseFailed) {
                const failedGeneration = err?.error?.error?.failed_generation || err?.failed_generation;
                const inline = failedGeneration ? this.extractInlineFunctionTag(failedGeneration) : null;
                if (inline?.name) {
                    this.logger.warn(`Groq tool_use_failed nhưng bóc tách được cú pháp lỗi từ failed_generation, tự chuyển thành tool_calls: ${inline.name}(${JSON.stringify(inline.args)})`);
                    return {
                        choices: [
                            {
                                message: {
                                    role: 'assistant',
                                    content: null,
                                    tool_calls: [
                                        {
                                            id: `self-healed-${Date.now()}`,
                                            type: 'function',
                                            function: {
                                                name: inline.name,
                                                arguments: JSON.stringify(inline.args || {}),
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    };
                }
                if (retries > 0) {
                    this.logger.warn(`Groq tool_use_failed, thử lại với temperature thấp hơn (còn ${retries} lần thử)`);
                    return this.callGroqWithRetry({ ...params, temperature: 0.1 }, retries - 1, delayMs);
                }
            }
            throw err;
        }
    }
    extractInlineFunctionTag(content) {
        if (!content)
            return null;
        const match = content.match(/<function=([a-zA-Z0-9_]+)([\s\S]*)/);
        if (!match)
            return null;
        const name = match[1];
        const rest = match[2] || '';
        let args = {};
        const jsonMatch = rest.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                args = JSON.parse(jsonMatch[0]);
            }
            catch {
                args = {};
            }
        }
        const cleanText = content.slice(0, match.index).trim();
        return { name, args, cleanText };
    }
    stripInlineFunctionTags(content) {
        if (!content)
            return content;
        return content.replace(/<function=[\s\S]*?(<\/function>|$)/g, '').trim();
    }
    getSystemInstruction(userId) {
        const now = new Date();
        const weekdayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const todayStr = `${weekdayNames[now.getDay()]}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()} (${now.toISOString().split('T')[0]})`;
        const authContext = userId
            ? `\n\nTRẠNG THÁI ĐĂNG NHẬP: Khách hàng ĐANG ĐĂNG NHẬP (userId: ${userId}).
- Khi khách hỏi về "thông tin tài khoản của tôi", hãy dùng công cụ getMyProfile để tra cứu và trả lời trực tiếp.
- Khi khách hỏi "tôi đã đặt bàn chưa", "đơn đặt bàn của tôi", "trạng thái đơn của tôi"..., hãy dùng công cụ getMyReservations để tra cứu và trả lời trực tiếp.
- Khi khách ĐẶT BÀN MỚI và chưa cho biết tên/SĐT, hãy CHỦ ĐỘNG gọi getMyProfile trước để lấy sẵn tên/SĐT/email đã có trong tài khoản, chỉ hỏi lại nếu khách muốn dùng thông tin khác.
- TUYỆT ĐỐI không hỏi lại những thông tin đã có thể tra được qua getMyProfile.`
            : `\n\nTRẠNG THÁI ĐĂNG NHẬP: Khách hiện là khách vãng lai (CHƯA đăng nhập). Nếu khách hỏi về đơn đặt bàn cũ hoặc thông tin tài khoản của họ, hãy nhẹ nhàng cho biết cần đăng nhập để tra cứu chính xác, đồng thời vẫn có thể hỗ trợ đặt bàn mới bình thường.`;
        return `Bạn là AI Chăm Sóc Khách Hàng chuyên nghiệp của "Nhà hàng Dola Restaurant".
Nhiệm vụ của bạn là tư vấn, giải đáp thắc mắc, gợi ý món ăn, cung cấp thông tin khuyến mãi và hỗ trợ khách hàng đặt bàn.

THỜI GIAN HIỆN TẠI: Hôm nay là ${todayStr}.
QUAN TRỌNG: Khi khách nói "hôm nay", "ngày mai", "tối nay", "cuối tuần này"... hãy TÍNH TOÁN reservationDate dựa trên ngày hiện tại ở trên (định dạng YYYY-MM-DD), TUYỆT ĐỐI KHÔNG tự đoán hay dùng năm khác với năm hiện tại nêu trên.
${authContext}

THÔNG TIN NHÀ HÀNG DOLA RESTAURANT:
- Địa chỉ: 123 Đường Trần Phú, Hải Châu, Đà Nẵng
- Hotline: 1900 6750 | Điện thoại: 0988 123 456
- Giờ mở cửa: 08:00 - 22:30 mỗi ngày (Kể cả Lễ, Tết)
- Bãi đỗ xe: Miễn phí đỗ xe máy và xe ô tô, có bảo vệ trông giữ 24/7.
// - Giao hàng: Giao nhanh nội thành, miễn phí ship cho đơn từ 300.000đ trong bán kính 5km.
- Thanh toán: Tiền mặt, Chuyển khoản ngân hàng, Thẻ Visa/Mastercard, Ví MoMo, ZaloPay.

QUY NẮC TRẢ LỜI:
1. Luôn lịch sự, thân thiện, xưng "Dola Restaurant" hoặc "Em" và gọi khách là "Anh/Chị" (nếu chat bằng Tiếng Việt).
2. Tự động phản hồi bằng chính ngôn ngữ của khách (Tiếng Việt, Tiếng Anh, Tiếng Hàn, Tiếng Nhật, Tiếng Trung...).
3. Khi khách hỏi về món ăn / thực đơn / giá tiền: Dùng công cụ searchFoods để tìm thông tin chính xác từ database nhà hàng.
4. Khi khách hỏi về ưu đãi / khuyến mãi: Dùng công cụ getActivePromotions để tra cứu thông tin khuyến mãi mới nhất.
5. Khi khách muốn ĐẶT BÀN:
   - Thông tin BẮT BUỘC phải có đủ: Tên khách hàng (customerName), Số điện thoại (phone), Ngày đặt (reservationDate dạng YYYY-MM-DD), Giờ đặt (reservationTime dạng HH:mm), Số khách (partySize).
   - Nếu khách đang đăng nhập, hãy tận dụng getMyProfile để lấy sẵn thông tin thay vì hỏi lại (xem mục TRẠNG THÁI ĐĂNG NHẬP ở trên).
   - Email (email): KHÔNG bắt buộc, nhưng hãy CHỦ ĐỘNG hỏi khách "Anh/Chị có thể để lại email để nhận thư xác nhận khi nhà hàng duyệt đơn không ạ?" — nếu khách cung cấp thì truyền vào tham số email, nếu khách từ chối/không có thì vẫn tiếp tục tạo đơn bình thường không cần email.
   - ⚠️ XÁC NHẬN TRƯỚC KHI TẠO ĐƠN (BẮT BUỘC): Trước khi gọi createReservation, LUÔN LUÔN phải hiển thị tóm tắt thông tin đặt bàn cho khách xem và hỏi "Anh/Chị xác nhận thông tin đặt bàn trên chưa ạ?" hoặc tương tự. CHỈ gọi createReservation khi khách đã đồng ý/xác nhận (ví dụ: "ok", "đúng rồi", "xác nhận", "đặt đi", "yes"...). TUYỆT ĐỐI không tạo đơn ngay khi chưa có xác nhận từ khách.
   - Đơn đặt bàn qua chatbot sẽ ở trạng thái "chờ xác nhận" — nhân viên nhà hàng sẽ xác nhận sau, lúc đó mail xác nhận (nếu có email) mới được gửi. Hãy cho khách biết điều này trong câu trả lời.
6. Nếu chưa đủ thông tin đặt bàn, hãy hỏi lại một cách nhẹ nhàng từng thông tin còn thiếu.
7. Trình bày phản hồi ngắn gọn, rõ ràng, có thể dùng emoji để thân thiện hơn.`;
    }
    async resolveSession(rawSessionId, userId) {
        if (rawSessionId) {
            const sessionId = Number(rawSessionId);
            if (!Number.isNaN(sessionId)) {
                try {
                    return await this.chatService.findSessionById(sessionId);
                }
                catch {
                }
            }
        }
        return this.chatService.createSession(userId);
    }
    async handleChatMessage(dto, userId = null, rawSessionId) {
        const session = await this.resolveSession(rawSessionId, userId);
        const savedMsg = await this.chatService.addMessage(session.id, 'customer', userId, dto.message);
        if (session.status === 'waiting_staff' || session.status === 'staff') {
            this.chatGateway.broadcastMessage(session.id, savedMsg);
            return {
                success: true,
                reply: null,
                sessionId: session.id,
                handedOffToStaff: true,
            };
        }
        const result = await this.generateAiReply(dto, userId, session);
        if (result?.reply) {
            await this.chatService.addMessage(session.id, 'ai', null, result.reply);
        }
        return { ...result, sessionId: session.id };
    }
    async generateAiReply(dto, userId, session) {
        const apiKey = this.configService.get('GROQ_API_KEY');
        if (!this.groq && apiKey) {
            this.groq = new groq_sdk_1.default({ apiKey });
        }
        if (this.groq) {
            try {
                const tools = [
                    {
                        type: 'function',
                        function: {
                            name: 'searchFoods',
                            description: 'Tìm kiếm món ăn trong thực đơn của nhà hàng theo từ khóa, danh mục hoặc giá.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    search: { type: 'string', description: 'Từ khóa tìm món ăn' },
                                    minPrice: { type: 'number', description: 'Giá tối thiểu' },
                                    maxPrice: { type: 'number', description: 'Giá tối đa' },
                                },
                            },
                        },
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'getActivePromotions',
                            description: 'Lấy danh sách các chương trình khuyến mãi và mã ưu đãi đang diễn ra.',
                            parameters: {
                                type: 'object',
                                properties: {},
                            },
                        },
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'createReservation',
                            description: 'Tạo đơn đặt bàn mới cho khách hàng khi đã thu thập đủ thông tin.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    customerName: { type: 'string', description: 'Tên đầy đủ của khách hàng' },
                                    phone: { type: 'string', description: 'Số điện thoại liên hệ' },
                                    email: { type: 'string', description: 'Email của khách hàng (nếu có) để gửi thư xác nhận' },
                                    reservationDate: { type: 'string', description: 'Ngày đặt bàn (định dạng YYYY-MM-DD)' },
                                    reservationTime: { type: 'string', description: 'Giờ đặt bàn (định dạng HH:mm)' },
                                    partySize: { type: 'number', description: 'Số lượng người (số khách)' },
                                    note: { type: 'string', description: 'Ghi chú thêm (nếu có)' },
                                },
                                required: ['customerName', 'phone', 'reservationDate', 'reservationTime', 'partySize'],
                            },
                        },
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'escalateToStaff',
                            description: 'Chuyển hội thoại cho nhân viên thật xử lý trực tiếp. Dùng khi: khách yêu cầu gặp người thật/nhân viên, khách bực bội/phàn nàn/khiếu nại, hoặc câu hỏi vượt quá khả năng AI (sự cố đơn hàng, yêu cầu đặc biệt, khiếu nại dịch vụ).',
                            parameters: {
                                type: 'object',
                                properties: {
                                    reason: { type: 'string', description: 'Lý do ngắn gọn cần chuyển cho nhân viên' },
                                },
                            },
                        },
                    },
                    ...(userId
                        ? [
                            {
                                type: 'function',
                                function: {
                                    name: 'getMyProfile',
                                    description: 'Lấy thông tin tài khoản của khách hàng đang đăng nhập (họ tên, email, số điện thoại, vai trò).',
                                    parameters: { type: 'object', properties: {} },
                                },
                            },
                            {
                                type: 'function',
                                function: {
                                    name: 'getMyReservations',
                                    description: 'Lấy danh sách toàn bộ đơn đặt bàn (kèm trạng thái) của khách hàng đang đăng nhập.',
                                    parameters: { type: 'object', properties: {} },
                                },
                            },
                        ]
                        : []),
                ];
                const messages = [{ role: 'system', content: this.getSystemInstruction(userId) }];
                if (dto.history && Array.isArray(dto.history)) {
                    const validHistory = dto.history.filter((item) => item && item.parts && item.parts[0]?.text);
                    for (const item of validHistory) {
                        messages.push({
                            role: item.role === 'user' ? 'user' : 'assistant',
                            content: item.parts[0].text,
                        });
                    }
                }
                messages.push({ role: 'user', content: dto.message });
                let response = await this.callGroqWithRetry({
                    model: this.GROQ_MODEL,
                    messages,
                    tools,
                    tool_choice: 'auto',
                    temperature: 0.3,
                    parallel_tool_calls: false,
                });
                let choice = response.choices[0];
                const toolCalls = choice.message.tool_calls;
                let reservationAlreadyCreated = false;
                if (toolCalls && toolCalls.length > 0) {
                    messages.push(choice.message);
                    const toolNamesInBatch = toolCalls.map((tc) => tc.function.name);
                    const isLookupBatch = toolNamesInBatch.includes('getMyReservations');
                    if (isLookupBatch && toolNamesInBatch.includes('createReservation')) {
                        this.logger.warn(`BLOCKED: createReservation bị chặn vì xuất hiện cùng batch với getMyReservations (luồng tra cứu, không phải đặt mới).`);
                    }
                    for (const toolCall of toolCalls) {
                        const name = toolCall.function.name;
                        let args = {};
                        try {
                            args = JSON.parse(toolCall.function.arguments || '{}');
                        }
                        catch {
                            args = {};
                        }
                        this.logger.log(`Groq Tool Call: ${name} với params: ${JSON.stringify(args)}`);
                        let toolResult;
                        if (name === 'searchFoods') {
                            toolResult = await this.executeSearchFoods(args);
                        }
                        else if (name === 'getActivePromotions') {
                            toolResult = await this.executeGetPromotions();
                        }
                        else if (name === 'createReservation') {
                            if (isLookupBatch) {
                                toolResult = {
                                    status: 'blocked',
                                    message: 'Không thể tạo đơn đặt bàn trong cùng lượt tra cứu danh sách đơn. ' +
                                        'Hãy hỏi khách xem họ có muốn đặt bàn MỚI không, rồi xác nhận rõ ràng từng thông tin (ngày, giờ, số khách) trước khi tạo đơn.',
                                };
                            }
                            else {
                                toolResult = await this.executeCreateReservation(args, userId);
                                if (toolResult?.status === 'success') {
                                    reservationAlreadyCreated = true;
                                }
                            }
                        }
                        else if (name === 'getMyProfile') {
                            toolResult = await this.executeGetMyProfile(userId);
                        }
                        else if (name === 'getMyReservations') {
                            toolResult = await this.executeGetMyReservations(userId);
                        }
                        else if (name === 'escalateToStaff') {
                            toolResult = await this.executeEscalateToStaff(args, session.id);
                        }
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(toolResult),
                        });
                    }
                    response = await this.callGroqWithRetry({
                        model: this.GROQ_MODEL,
                        messages,
                    });
                    choice = response.choices[0];
                }
                else if (choice.message?.content) {
                    const inline = this.extractInlineFunctionTag(choice.message.content);
                    if (inline) {
                        if (inline.name === 'createReservation' && reservationAlreadyCreated) {
                            this.logger.warn(`Bỏ qua inline tag createReservation vì đơn đặt bàn đã được tạo trước đó (ngăn duplicate).`);
                        }
                        else {
                            this.logger.warn(`Groq trả tag function lỗi định dạng, tự sửa: ${inline.name}(${JSON.stringify(inline.args)})`);
                            let toolResult;
                            if (inline.name === 'searchFoods') {
                                toolResult = await this.executeSearchFoods(inline.args);
                            }
                            else if (inline.name === 'getActivePromotions') {
                                toolResult = await this.executeGetPromotions();
                            }
                            else if (inline.name === 'createReservation') {
                                toolResult = await this.executeCreateReservation(inline.args, userId);
                            }
                            else if (inline.name === 'getMyProfile') {
                                toolResult = await this.executeGetMyProfile(userId);
                            }
                            else if (inline.name === 'getMyReservations') {
                                toolResult = await this.executeGetMyReservations(userId);
                            }
                            else if (inline.name === 'escalateToStaff') {
                                toolResult = await this.executeEscalateToStaff(inline.args, session.id);
                            }
                            if (toolResult !== undefined) {
                                messages.push({ role: 'assistant', content: inline.cleanText || '...' });
                                messages.push({
                                    role: 'user',
                                    content: `[Kết quả tra cứu ${inline.name}]: ${JSON.stringify(toolResult)}\nHãy trả lời khách hàng dựa trên kết quả này, không dùng bất kỳ cú pháp function/tool nào trong câu trả lời.`,
                                });
                                response = await this.callGroqWithRetry({
                                    model: this.GROQ_MODEL,
                                    messages,
                                    temperature: 0.3,
                                });
                                choice = response.choices[0];
                            }
                        }
                    }
                }
                if (choice.message?.content) {
                    const cleanReply = this.stripInlineFunctionTags(choice.message.content);
                    if (cleanReply) {
                        return {
                            success: true,
                            reply: cleanReply,
                        };
                    }
                }
            }
            catch (error) {
                this.logger.error(`Lỗi Groq API: ${error?.message || error}`);
            }
        }
        return this.handleFallbackMessage(dto.message, userId, session);
    }
    async executeSearchFoods(args) {
        try {
            const search = args?.search;
            let result = await this.foodsService.findAll({
                search,
                minPrice: args?.minPrice,
                maxPrice: args?.maxPrice,
                isActive: true,
                limit: 10,
            });
            if (result.items.length === 0 && search) {
                const noAccentSearch = removeAccents(search);
                result = await this.foodsService.findAll({
                    search: noAccentSearch,
                    minPrice: args?.minPrice,
                    maxPrice: args?.maxPrice,
                    isActive: true,
                    limit: 10,
                });
            }
            if (result.items.length === 0 && search) {
                const target = removeAccents(search);
                const all = await this.foodsService.findAll({
                    minPrice: args?.minPrice,
                    maxPrice: args?.maxPrice,
                    isActive: true,
                    limit: 100,
                });
                result = {
                    ...all,
                    items: all.items.filter((f) => removeAccents(f.name).includes(target)),
                };
            }
            return result.items.slice(0, 10).map((food) => ({
                id: food.id,
                name: food.name,
                price: food.price,
                description: food.description,
                ingredients: food.ingredients,
                category: food.category?.name,
            }));
        }
        catch (err) {
            return { error: 'Không thể tra cứu món ăn lúc này.' };
        }
    }
    async executeGetPromotions() {
        try {
            const result = await this.promotionsService.findAll({
                status: 'ongoing',
                limit: 10,
            });
            return result.items.map((p) => ({
                title: p.title,
                code: p.code,
                discountType: p.discountType,
                discountValue: p.discountValue,
                description: p.description,
            }));
        }
        catch (err) {
            return { error: 'Không thể lấy thông tin khuyến mãi lúc này.' };
        }
    }
    async executeGetMyProfile(userId) {
        if (!userId) {
            return { error: 'Khách chưa đăng nhập nên không thể tra cứu thông tin tài khoản.' };
        }
        try {
            return await this.authService.getProfile(userId);
        }
        catch (err) {
            return { error: err?.message || 'Không thể lấy thông tin tài khoản lúc này.' };
        }
    }
    async executeGetMyReservations(userId) {
        if (!userId) {
            return { error: 'Khách chưa đăng nhập nên không thể tra cứu đơn đặt bàn.' };
        }
        try {
            const reservations = await this.reservationsService.findUserReservations(userId);
            if (reservations.length === 0) {
                return { message: 'Tài khoản này chưa có đơn đặt bàn nào.' };
            }
            return reservations.map((r) => ({
                id: r.id,
                date: r.reservationDate,
                time: r.reservationTime,
                partySize: r.partySize,
                tableNumber: r.tableNumber,
                status: r.status,
                note: r.note,
                cancelReason: r.cancelReason,
            }));
        }
        catch (err) {
            return { error: 'Không thể tra cứu đơn đặt bàn lúc này.' };
        }
    }
    async executeCreateReservation(args, userId = null) {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            if (args.reservationDate && args.reservationDate < todayStr) {
                return {
                    status: 'error',
                    message: `Ngày đặt bàn "${args.reservationDate}" đã ở trong quá khứ (hôm nay là ${todayStr}). Vui lòng xác nhận lại ngày đặt bàn chính xác với khách.`,
                };
            }
            const newReservation = await this.reservationsService.create({
                customerName: args.customerName,
                phone: args.phone,
                email: args.email || undefined,
                partySize: Number(args.partySize),
                reservationDate: args.reservationDate,
                reservationTime: args.reservationTime,
                note: args.note ? `[Đặt qua AI Chatbot] ${args.note}` : '[Đặt qua AI Chatbot]',
            }, false, userId || undefined);
            return {
                status: 'success',
                reservationId: newReservation.id,
                message: 'Đặt bàn thành công! Hệ thống đã ghi nhận thông tin đặt bàn của quý khách.',
                details: {
                    name: newReservation.customerName,
                    phone: newReservation.phone,
                    email: newReservation.email,
                    date: newReservation.reservationDate,
                    time: newReservation.reservationTime,
                    partySize: newReservation.partySize,
                },
            };
        }
        catch (err) {
            return {
                status: 'error',
                message: err?.message || 'Không thể khởi tạo đơn đặt bàn.',
            };
        }
    }
    async executeEscalateToStaff(args, sessionId) {
        try {
            const session = await this.chatService.escalate(sessionId, args?.reason);
            this.chatGateway.notifyNewEscalation(session);
            return {
                status: 'success',
                message: 'Đã chuyển hội thoại cho nhân viên. Hãy báo cho khách biết nhân viên sẽ tiếp nhận trong giây lát, không tiếp tục tư vấn thêm sau bước này.',
            };
        }
        catch (err) {
            return { status: 'error', message: err?.message || 'Không thể chuyển cho nhân viên lúc này.' };
        }
    }
    async handleFallbackMessage(msg, userId = null, session) {
        const raw = removeAccents(msg);
        const wantsHuman = raw.includes('gap nhan vien') ||
            raw.includes('noi chuyen voi nguoi') ||
            raw.includes('nhan vien tu van') ||
            raw.includes('khieu nai');
        if (wantsHuman && session) {
            const updated = await this.chatService.escalate(session.id, 'Khách yêu cầu qua kênh fallback (không dùng AI)');
            this.chatGateway.notifyNewEscalation(updated);
            return {
                success: true,
                reply: '🙏 Dạ em đã chuyển yêu cầu của Anh/Chị cho nhân viên tư vấn, xin chờ trong giây lát ạ!',
            };
        }
        const isMyAccountQuery = raw.includes('tai khoan cua toi') ||
            raw.includes('thong tin cua toi') ||
            raw.includes('don cua toi') ||
            raw.includes('don dat ban cua toi') ||
            raw.includes('toi da dat ban chua') ||
            raw.includes('trang thai don');
        if (isMyAccountQuery) {
            if (!userId) {
                return {
                    success: true,
                    reply: '🔒 **Anh/Chị cần đăng nhập để tra cứu thông tin này.**\n\n' +
                        'Sau khi đăng nhập, em có thể xem giúp Anh/Chị thông tin tài khoản và toàn bộ đơn đặt bàn đã đặt trước đó ạ!',
                };
            }
            try {
                const reservations = await this.reservationsService.findUserReservations(userId);
                if (reservations.length === 0) {
                    return {
                        success: true,
                        reply: '📋 Tài khoản của Anh/Chị hiện **chưa có đơn đặt bàn nào**. Anh/Chị muốn đặt bàn ngay bây giờ không ạ?',
                    };
                }
                const listStr = reservations
                    .slice(0, 5)
                    .map((r) => `📅 **Đơn #${r.id}** - ${r.reservationDate} lúc ${r.reservationTime} (${r.partySize} khách)\n   Trạng thái: **${r.status}**`)
                    .join('\n\n');
                return {
                    success: true,
                    reply: `📋 **Các đơn đặt bàn gần đây của Anh/Chị:**\n\n${listStr}`,
                };
            }
            catch (e) {
                this.logger.warn(`Fallback findUserReservations failed: ${e?.message || e}`);
                return {
                    success: true,
                    reply: '❌ Không thể tra cứu đơn đặt bàn lúc này. Anh/Chị vui lòng thử lại sau ít phút nhé!',
                };
            }
        }
        if (raw.includes('gio') ||
            raw.includes('mo cua') ||
            raw.includes('may gio') ||
            raw.includes('khi nao') ||
            raw.includes('dia chi') ||
            raw.includes('o dau') ||
            raw.includes('vi tri') ||
            raw.includes('do xe') ||
            raw.includes('bai xe')) {
            return {
                success: true,
                reply: '⏰ **Thông tin Dola Restaurant:**\n\n' +
                    '• **Giờ mở cửa:** 08:00 - 22:30 mỗi ngày (Kể cả Lễ, Tết)\n' +
                    '• **Địa chỉ:** 123 Đường Trần Phú, Hải Châu, Đà Nẵng\n' +
                    '• **Bãi đỗ xe:** Có bãi đỗ ô tô & xe máy rộng rãi, **miễn phí** có bảo vệ trông giữ 24/7!\n' +
                    '• **Hotline:** 1900 6750 | 0988 123 456',
            };
        }
        if (raw.includes('khuyen mai') ||
            raw.includes('uu dai') ||
            raw.includes('voucher') ||
            raw.includes('giam gia')) {
            try {
                const promos = await this.executeGetPromotions();
                if (Array.isArray(promos) && promos.length > 0) {
                    let listStr = promos
                        .map((p) => `🏷️ **${p.title}** (Mã: \`${p.code}\`)\n   - ${p.description || 'Ưu đãi đặc biệt cho khách hàng đặt bàn trước'}\n`)
                        .join('\n');
                    return {
                        success: true,
                        reply: `🎁 **Các Chương Trình Khuyến Mãi Đang Diễn Ra:**\n\n${listStr}\nAnh/Chị hãy nhập mã ưu đãi khi đặt bàn để nhận khuyến mãi nhé!`,
                    };
                }
            }
            catch (e) {
                this.logger.warn(`Fallback getActivePromotions failed: ${e?.message || e}`);
            }
            return {
                success: true,
                reply: '🏷️ **Chương trình Ưu Đãi Dola Restaurant:**\n\n' +
                    '• Giảm ngay **10%** cho bàn đặt trước từ 4 người qua Website.\n' +
                    '• Tặng món tráng miệng đặc biệt cho khách sinh nhật trong tháng.\n' +
                    '• Anh/Chị có thể xem thêm thông tin tại trang "Khuyến Mãi" của nhà hàng!',
            };
        }
        const isFoodQuery = raw.includes('thuc don') ||
            raw.includes('mon') ||
            raw.includes('menu') ||
            raw.includes('gia') ||
            raw.includes('goi y') ||
            raw.includes('an gi') ||
            raw.includes('an no') ||
            raw.includes('ngon') ||
            raw.includes('toi nay') ||
            raw.includes('dat nhat') ||
            raw.includes('re nhat') ||
            /\b\d+\s*k\b/.test(raw);
        if (isFoodQuery && !raw.includes('dat ban')) {
            try {
                const foods = await this.executeSearchFoods({});
                if (Array.isArray(foods) && foods.length > 0) {
                    if (raw.includes('dat nhat') || raw.includes('cao nhat')) {
                        const sorted = [...foods].sort((a, b) => Number(b.price) - Number(a.price));
                        const topFood = sorted[0];
                        return {
                            success: true,
                            reply: `👑 **Món Ăn Cao Cấp Nhất Tại Dola Restaurant:**\n\n` +
                                `🍲 **${topFood.name}**\n` +
                                `• **Giá:** ${Number(topFood.price).toLocaleString('vi-VN')}đ\n` +
                                `• **Danh mục:** ${topFood.category || 'Món chính'}\n` +
                                `• **Mô tả:** ${topFood.description || 'Món ăn đặc sản thơm ngon hấp dẫn được chế biến công phu bởi đầu bếp hàng đầu.'}`,
                        };
                    }
                    if (raw.includes('re nhat') || raw.includes('thap nhat')) {
                        const sorted = [...foods].sort((a, b) => Number(a.price) - Number(b.price));
                        const topFood = sorted[0];
                        return {
                            success: true,
                            reply: `🏷️ **Món Ăn Giá Tiết Kiệm Nhất:**\n\n` +
                                `🍲 **${topFood.name}**\n` +
                                `• **Giá:** ${Number(topFood.price).toLocaleString('vi-VN')}đ\n` +
                                `• **Mô tả:** ${topFood.description || 'Món ăn ngon đậm đà với mức giá cực kỳ bình dân.'}`,
                        };
                    }
                    const kMatch = raw.match(/(\d+)\s*k/);
                    if (kMatch) {
                        const maxBudget = parseInt(kMatch[1], 10) * 1000;
                        const affordableFoods = foods.filter((f) => Number(f.price) <= maxBudget);
                        if (affordableFoods.length > 0) {
                            const listStr = affordableFoods
                                .slice(0, 5)
                                .map((f) => `🍲 **${f.name}** - ${Number(f.price).toLocaleString('vi-VN')}đ`)
                                .join('\n');
                            return {
                                success: true,
                                reply: `💰 **Gợi Ý Món Ngon Tầm Giá Dưới ${parseInt(kMatch[1], 10)}.000đ:**\n\n${listStr}\n\nAnh/Chị có thể đặt trước bàn để nhà hàng chuẩn bị sẵn sàng phục vụ ạ!`,
                            };
                        }
                    }
                    const foodList = foods
                        .slice(0, 5)
                        .map((f) => `🍲 **${f.name}** - ${Number(f.price).toLocaleString('vi-VN')}đ\n   ${f.description ? `_${f.description}_` : ''}`)
                        .join('\n\n');
                    return {
                        success: true,
                        reply: `🍽️ **Gợi Ý Thực Đơn Món Ngon Ăn No Tối Nay:**\n\n${foodList}\n\nAnh/Chị có thể chọn món và đặt bàn trước ngay với em nhé!`,
                    };
                }
            }
            catch (e) {
                this.logger.warn(`Fallback searchFoods failed: ${e?.message || e}`);
            }
            return {
                success: true,
                reply: '🍽️ **Thực Đơn Dola Restaurant:**\n\n' +
                    'Nhà hàng phục vụ đa dạng các món Á - Âu cao cấp, lẩu nướng & hải sản tươi sống.\n' +
                    'Anh/Chị có thể bấm vào mục **"Thực đơn"** trên menu website để xem hình ảnh và bảng giá chi tiết ạ!',
            };
        }
        const phoneMatch = raw.match(/(0[3|5|7|8|9][0-9]{8})/);
        const emailMatch = msg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const numPeopleMatch = raw.match(/(\d+)\s*(nguoi|khach|người|khách|ban|bàn|p)/i);
        if (phoneMatch || numPeopleMatch || raw.includes('dat ban') || raw.includes('muon dat')) {
            if (phoneMatch) {
                const phone = phoneMatch[0];
                const email = emailMatch ? emailMatch[0] : undefined;
                const partySize = numPeopleMatch ? parseInt(numPeopleMatch[1], 10) : 2;
                let reservationDate = new Date().toISOString().split('T')[0];
                const ymdMatch = msg.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
                const dmyMatch = msg.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
                const dmMatch = msg.match(/(\d{1,2})[-/](\d{1,2})/);
                if (ymdMatch) {
                    const y = ymdMatch[1];
                    const m = ymdMatch[2].padStart(2, '0');
                    const d = ymdMatch[3].padStart(2, '0');
                    reservationDate = `${y}-${m}-${d}`;
                }
                else if (dmyMatch) {
                    const d = dmyMatch[1].padStart(2, '0');
                    const m = dmyMatch[2].padStart(2, '0');
                    const y = dmyMatch[3];
                    reservationDate = `${y}-${m}-${d}`;
                }
                else if (dmMatch) {
                    const d = dmMatch[1].padStart(2, '0');
                    const m = dmMatch[2].padStart(2, '0');
                    const y = new Date().getFullYear();
                    reservationDate = `${y}-${m}-${d}`;
                }
                let reservationTime = '18:30';
                const timeColonMatch = msg.match(/([0-1]?\d|2[0-3]):([0-5]\d)/);
                const timeHMatch = msg.match(/([0-1]?\d|2[0-3])[hH]([0-5]\d)?/);
                if (timeColonMatch) {
                    const h = timeColonMatch[1].padStart(2, '0');
                    const m = timeColonMatch[2];
                    reservationTime = `${h}:${m}`;
                }
                else if (timeHMatch) {
                    const h = timeHMatch[1].padStart(2, '0');
                    const m = timeHMatch[2] ? timeHMatch[2].padStart(2, '0') : '00';
                    reservationTime = `${h}:${m}`;
                }
                let cleanName = msg;
                cleanName = cleanName.replace(/(0[3|5|7|8|9][0-9]{8})/g, '');
                if (email)
                    cleanName = cleanName.replace(email, '');
                cleanName = cleanName.replace(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g, '');
                cleanName = cleanName.replace(/(\d{1,2}[-/]\d{1,2}([-/]\d{4})?)/g, '');
                cleanName = cleanName.replace(/([0-1]?\d|2[0-3])[:hH]([0-5]\d)?/gi, '');
                cleanName = cleanName.replace(/\d+\s*(nguoi|khach|người|khách|bàn|ban|p)/gi, '');
                cleanName = cleanName.replace(/[-_.,;]/g, ' ').trim();
                const customerName = cleanName.length > 0 ? cleanName.slice(0, 30) : 'Khách Hàng';
                try {
                    const res = await this.executeCreateReservation({
                        customerName,
                        phone,
                        email,
                        reservationDate,
                        reservationTime,
                        partySize,
                        note: msg,
                    }, userId);
                    if (res.status === 'success') {
                        return {
                            success: true,
                            reply: `🎉 **ĐẶT BÀN THÀNH CÔNG!**\n\n` +
                                `• **Khách hàng:** ${customerName}\n` +
                                `• **Số điện thoại:** ${phone}\n` +
                                `${email ? `• **Email:** ${email}\n` : ''}` +
                                `• **Số khách:** ${partySize} người\n` +
                                `• **Ngày đặt:** ${reservationDate}\n` +
                                `• **Giờ đặt:** ${reservationTime}\n\n` +
                                `Nhân viên Dola Restaurant sẽ gọi lại SĐT **${phone}** để xác nhận giờ đón khách trong ít phút nữa.` +
                                `${email ? ` Khi đơn được xác nhận, Anh/Chị cũng sẽ nhận được email xác nhận gửi tới **${email}**.` : ''} Cảm ơn Anh/Chị!`,
                        };
                    }
                }
                catch (e) {
                    this.logger.warn(`Fallback createReservation failed: ${e?.message || e}`);
                }
            }
            return {
                success: true,
                reply: '📅 **Hướng Dẫn Đặt Bàn Nhanh:**\n\n' +
                    'Để đặt bàn, Anh/Chị vui lòng cung cấp thông tin theo cú pháp:\n' +
                    '👉 **[Tên] - [SĐT] - [Gmail (nếu có)] - [Ngày đặt] - [Giờ đặt] - [Số khách]**\n\n' +
                    'Ví dụ: _"Nguyễn Văn A 0901234567 nguyenvana@gmail.com 2026-08-10 19:00 4 người"_\n' +
                    'Em sẽ tự động ghi nhận đơn đặt bàn vào hệ thống nhà hàng ngay lập tức ạ!',
            };
        }
        return {
            success: true,
            reply: '👋 **Chào mừng Anh/Chị đến với Dola Restaurant!**\n\n' +
                'Em có thể hỗ trợ Anh/Chị về:\n' +
                '• ⏰ **Giờ mở cửa & Địa chỉ**\n' +
                '• 🍽️ **Gợi ý thực đơn & Giá cả (Món đắt nhất, món rẻ nhất, theo ngân sách)**\n' +
                '• 🏷️ **Chương trình khuyến mãi**\n' +
                '• 📅 **Hướng dẫn Đặt bàn trước (Hỗ trợ nhập Gmail nhận xác nhận)**\n\n' +
                'Anh/Chị hãy thử bấm vào các nút gợi ý bên trên hoặc nhập câu hỏi chi tiết giúp em nhé!',
        };
    }
};
exports.ChatbotService = ChatbotService;
exports.ChatbotService = ChatbotService = ChatbotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_service_1.ChatService))),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        foods_service_1.FoodsService,
        reservations_service_1.ReservationsService,
        promotions_service_1.PromotionsService,
        auth_service_1.AuthService,
        chat_service_1.ChatService,
        chat_gateway_1.ChatGateway])
], ChatbotService);
//# sourceMappingURL=chatbot.service.js.map