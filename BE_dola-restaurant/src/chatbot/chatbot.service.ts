import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { FoodsService } from '../foods/foods.service';
import { ReservationsService } from '../reservations/reservations.service';
import { PromotionsService } from '../promotions/promotions.service';
import { AuthService } from '../auth/auth.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatService } from '../chat/chat.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ChatSession } from '../chat/entities/chat-session.entity';

function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private groq: Groq | null = null;
  // Model miễn phí trên Groq, hỗ trợ tool/function calling, tốc độ rất nhanh
  private readonly GROQ_MODEL = 'openai/gpt-oss-120b';

  constructor(
    private readonly configService: ConfigService,
    private readonly foodsService: FoodsService,
    private readonly reservationsService: ReservationsService,
    private readonly promotionsService: PromotionsService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    }
  }

  /**
   * Gọi Groq với retry khi gặp lỗi:
   * - 429 (rate-limit tạm thời): chờ rồi thử lại.
   * - tool_use_failed (model sinh sai cú pháp gọi tool):
   *   thử lại 1 lần với temperature thấp hơn để giảm khả năng lặp lỗi.
   * Nếu vẫn lỗi sau khi hết lượt retry, ném lỗi ra ngoài để rơi vào fallback engine.
   */
  private async callGroqWithRetry(params: any, retries = 1, delayMs = 3000): Promise<any> {
    try {
      return await this.groq!.chat.completions.create(params);
    } catch (err: any) {
      const isRateLimit = err?.status === 429;
      const isToolUseFailed = err?.error?.error?.code === 'tool_use_failed' || err?.code === 'tool_use_failed';

      if (isRateLimit && retries > 0) {
        this.logger.warn(`Groq rate-limited, retry sau ${delayMs}ms (còn ${retries} lần thử)`);
        await new Promise((res) => setTimeout(res, delayMs));
        return this.callGroqWithRetry(params, retries - 1, delayMs);
      }

      if (isToolUseFailed) {
        // Groq trả lỗi 400 tool_use_failed TRƯỚC KHI trả về message — nghĩa là
        // extractInlineFunctionTag() ở nhánh content bên dưới không bao giờ có cơ hội
        // chạy tới. Nhưng error payload của Groq vẫn kèm "failed_generation" chứa
        // đúng cú pháp lỗi <function=name{...}>. Bóc tách trực tiếp từ đó và tự
        // "self-heal" thành một response giả dạng tool_calls chuẩn, thay vì tốn thêm
        // 1 lượt gọi API retry (thường sinh lại lỗi y hệt vì cùng nguyên nhân).
        const failedGeneration = err?.error?.error?.failed_generation || err?.failed_generation;
        const inline = failedGeneration ? this.extractInlineFunctionTag(failedGeneration) : null;

        if (inline?.name) {
          this.logger.warn(
            `Groq tool_use_failed nhưng bóc tách được cú pháp lỗi từ failed_generation, tự chuyển thành tool_calls: ${inline.name}(${JSON.stringify(inline.args)})`,
          );
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

  /**
   * Đôi khi model (openai/gpt-oss-120b qua Groq) không trả về đúng chuẩn tool_calls
   * mà nhét thẳng cú pháp lỗi kiểu <function=name{"arg":"val"}> vào content text.
   * Hàm này phát hiện & bóc tách tên hàm + tham số từ cú pháp lỗi đó để tự xử lý,
   * thay vì để lộ cú pháp kỹ thuật ra cho người dùng.
   */
  private extractInlineFunctionTag(
    content: string,
  ): { name: string; args: any; cleanText: string } | null {
    if (!content) return null;
    const match = content.match(/<function=([a-zA-Z0-9_]+)([\s\S]*)/);
    if (!match) return null;

    const name = match[1];
    const rest = match[2] || '';
    let args: any = {};
    const jsonMatch = rest.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        args = JSON.parse(jsonMatch[0]);
      } catch {
        args = {};
      }
    }

    const cleanText = content.slice(0, match.index).trim();
    return { name, args, cleanText };
  }

  /**
   * Lưới an toàn cuối cùng: xóa sạch mọi tag <function...> còn sót lại trong text
   * trước khi trả về người dùng, phòng trường hợp bước tự sửa ở trên không xử lý hết.
   */
  private stripInlineFunctionTags(content: string): string {
    if (!content) return content;
    return content.replace(/<function=[\s\S]*?(<\/function>|$)/g, '').trim();
  }

  /**
   * userId != null  => khách đang đăng nhập, AI được cấp thêm quyền tra cứu
   * hồ sơ/đơn đặt bàn của chính khách đó và không cần hỏi lại tên/SĐT/email.
   * userId == null  => khách vãng lai, AI chỉ có các công cụ công khai.
   */
  private getSystemInstruction(userId: number | null): string {
    // Cung cấp ngày giờ hiện tại THỰC cho model — nếu không có, model sẽ tự đoán
    // theo dữ liệu huấn luyện (thường ra năm cũ như 2024), khiến đơn đặt bàn bị
    // lưu sai năm và "biến mất" khỏi lịch admin vì UI lọc theo ngày đang xem.
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

QUY TẮC TRẢ LỜI:
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

  /**
   * sessionId từ DTO là string (frontend lưu localStorage). Nếu thiếu, không
   * parse được, hoặc session không còn tồn tại -> tự tạo session mới thay vì
   * throw lỗi, để khách luôn chat được kể cả lần đầu hoặc mất sessionId.
   */
  private async resolveSession(rawSessionId: string | undefined, userId: number | null): Promise<ChatSession> {
    if (rawSessionId) {
      const sessionId = Number(rawSessionId);
      if (!Number.isNaN(sessionId)) {
        try {
          return await this.chatService.findSessionById(sessionId);
        } catch {
          // session không tồn tại (VD: đã bị xoá) -> rơi xuống tạo mới bên dưới
        }
      }
    }
    return this.chatService.createSession(userId);
  }

  /**
   * @param userId  id tài khoản đang đăng nhập, lấy từ req.user (JwtStrategy trả
   *                về { userId, email, role }) qua OptionalJwtAuthGuard ở controller.
   *                null nếu khách vãng lai — mọi luồng bên dưới đều phải chấp nhận
   *                null và không được throw lỗi vì chuyện đó.
   * @param rawSessionId  sessionId dạng string do frontend gửi lên (localStorage).
   */
  async handleChatMessage(dto: ChatMessageDto, userId: number | null = null, rawSessionId?: string) {
    const session = await this.resolveSession(rawSessionId || dto.sessionId, userId);

    // Lưu tin nhắn khách TRƯỚC, bất kể sau đó AI hay staff xử lý
    const savedMsg = await this.chatService.addMessage(session.id, 'customer', userId, dto.message);

    // Session đang có nhân viên xử lý -> không gọi AI nữa, chỉ lưu + báo real-time cho staff
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

  private async generateAiReply(dto: ChatMessageDto, userId: number | null, session: ChatSession) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!this.groq && apiKey) {
      this.groq = new Groq({ apiKey });
    }

    if (this.groq) {
      try {
        // Khai báo tools theo chuẩn OpenAI-compatible (Groq dùng chung format này)
        const tools: any[] = [
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
              description:
                'Chuyển hội thoại cho nhân viên thật xử lý trực tiếp. Dùng khi: khách yêu cầu gặp người thật/nhân viên, khách bực bội/phàn nàn/khiếu nại, hoặc câu hỏi vượt quá khả năng AI (sự cố đơn hàng, yêu cầu đặc biệt, khiếu nại dịch vụ).',
              parameters: {
                type: 'object',
                properties: {
                  reason: { type: 'string', description: 'Lý do ngắn gọn cần chuyển cho nhân viên' },
                },
              },
            },
          },
          // Hai tool dưới đây CHỈ được thêm vào khi khách đang đăng nhập —
          // khách vãng lai (userId null) sẽ không thấy các tool này trong
          // danh sách nên model không thể "ảo giác" ra dữ liệu cá nhân.
          ...(userId
            ? [
              {
                type: 'function',
                function: {
                  name: 'getMyProfile',
                  description:
                    'Lấy thông tin tài khoản của khách hàng đang đăng nhập (họ tên, email, số điện thoại, vai trò).',
                  parameters: { type: 'object', properties: {} },
                },
              },
              {
                type: 'function',
                function: {
                  name: 'getMyReservations',
                  description:
                    'Lấy danh sách toàn bộ đơn đặt bàn (kèm trạng thái) của khách hàng đang đăng nhập.',
                  parameters: { type: 'object', properties: {} },
                },
              },
            ]
            : []),
        ];

        // Xây messages theo chuẩn OpenAI-compatible: system → history → tin nhắn mới
        const messages: any[] = [{ role: 'system', content: this.getSystemInstruction(userId) }];

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

        // Gọi Groq (có retry khi bị rate-limit hoặc model sinh sai cú pháp tool call)
        // temperature thấp + tắt parallel_tool_calls giúp giảm lỗi tool_use_failed
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

        // Flag để tránh gọi createReservation 2 lần (một lần qua tool_calls chuẩn,
        // một lần qua inline function tag lỗi định dạng mà Groq đôi khi nhét vào câu trả lời).
        let reservationAlreadyCreated = false;

        if (toolCalls && toolCalls.length > 0) {
          // Xử lý TẤT CẢ tool calls trả về, không chỉ cái đầu tiên
          messages.push(choice.message);

          // GUARD: Phát hiện sớm "luồng tra cứu" — nếu batch này có getMyReservations
          // thì CHẶN createReservation để tránh AI tự tạo đơn khi user chỉ muốn xem danh sách.
          const toolNamesInBatch = toolCalls.map((tc: any) => tc.function.name);
          const isLookupBatch = toolNamesInBatch.includes('getMyReservations');
          if (isLookupBatch && toolNamesInBatch.includes('createReservation')) {
            this.logger.warn(
              `BLOCKED: createReservation bị chặn vì xuất hiện cùng batch với getMyReservations (luồng tra cứu, không phải đặt mới).`,
            );
          }

          for (const toolCall of toolCalls) {
            const name = toolCall.function.name;
            let args: any = {};
            try {
              args = JSON.parse(toolCall.function.arguments || '{}');
            } catch {
              args = {};
            }
            this.logger.log(`Groq Tool Call: ${name} với params: ${JSON.stringify(args)}`);

            let toolResult: any;
            if (name === 'searchFoods') {
              toolResult = await this.executeSearchFoods(args);
            } else if (name === 'getActivePromotions') {
              toolResult = await this.executeGetPromotions();
            } else if (name === 'createReservation') {
              // Chặn createReservation nếu đang trong luồng tra cứu (getMyReservations cùng batch)
              if (isLookupBatch) {
                toolResult = {
                  status: 'blocked',
                  message:
                    'Không thể tạo đơn đặt bàn trong cùng lượt tra cứu danh sách đơn. ' +
                    'Hãy hỏi khách xem họ có muốn đặt bàn MỚI không, rồi xác nhận rõ ràng từng thông tin (ngày, giờ, số khách) trước khi tạo đơn.',
                };
              } else {
                toolResult = await this.executeCreateReservation(args, userId);
                // Đánh dấu đã tạo đơn để ngăn gọi lại từ nhánh inline tag bên dưới
                if (toolResult?.status === 'success') {
                  reservationAlreadyCreated = true;
                }
              }
            } else if (name === 'getMyProfile') {
              toolResult = await this.executeGetMyProfile(userId);
            } else if (name === 'getMyReservations') {
              toolResult = await this.executeGetMyReservations(userId);
            } else if (name === 'escalateToStaff') {
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
        } else if (choice.message?.content) {
          // Model không trả tool_calls đúng chuẩn, nhưng có thể đã nhét sai cú pháp
          // <function=...> vào content text. Phát hiện & tự sửa thay vì để lộ ra ngoài.
          const inline = this.extractInlineFunctionTag(choice.message.content);
          if (inline) {
            // Nếu createReservation đã được gọi thành công trước đó qua tool_calls chuẩn,
            // bỏ qua inline tag này để tránh tạo đơn đặt bàn trùng lặp.
            if (inline.name === 'createReservation' && reservationAlreadyCreated) {
              this.logger.warn(
                `Bỏ qua inline tag createReservation vì đơn đặt bàn đã được tạo trước đó (ngăn duplicate).`,
              );
            } else {
              this.logger.warn(
                `Groq trả tag function lỗi định dạng, tự sửa: ${inline.name}(${JSON.stringify(inline.args)})`,
              );

              let toolResult: any;
              if (inline.name === 'searchFoods') {
                toolResult = await this.executeSearchFoods(inline.args);
              } else if (inline.name === 'getActivePromotions') {
                toolResult = await this.executeGetPromotions();
              } else if (inline.name === 'createReservation') {
                toolResult = await this.executeCreateReservation(inline.args, userId);
              } else if (inline.name === 'getMyProfile') {
                toolResult = await this.executeGetMyProfile(userId);
              } else if (inline.name === 'getMyReservations') {
                toolResult = await this.executeGetMyReservations(userId);
              } else if (inline.name === 'escalateToStaff') {
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
      } catch (error: any) {
        this.logger.error(`Lỗi Groq API: ${error?.message || error}`);
      }
    }

    // Fallback Engine khi API Key hết quota hoặc lỗi
    return this.handleFallbackMessage(dto.message, userId, session);
  }

  private async executeSearchFoods(args: any) {
    try {
      const search = args?.search;
      let result = await this.foodsService.findAll({
        search,
        minPrice: args?.minPrice,
        maxPrice: args?.maxPrice,
        isActive: true,
        limit: 10,
      });

      // Model đôi khi sinh SAI dấu tiếng Việt trong search term — đặc biệt khi đi qua
      // nhánh self-heal từ failed_generation, vì lúc đó model đang gõ text tự do
      // (không qua structured JSON mode) nên dễ lệch dấu, ví dụ "bún tháng" bị sinh
      // thành "buén thảng". Nếu search có dấu không ra kết quả, thử lại không dấu.
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

      // Vẫn không có kết quả -> tự khớp thủ công không dấu trên danh sách món đang
      // active, phòng trường hợp foodsService.findAll so khớp có dấu chặt (không tự
      // chuẩn hoá dấu khi tìm kiếm).
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
    } catch (err) {
      return { error: 'Không thể tra cứu món ăn lúc này.' };
    }
  }

  private async executeGetPromotions() {
    try {
      const result = await this.promotionsService.findAll({
        status: 'ongoing' as any,
        limit: 10,
      });
      return result.items.map((p) => ({
        title: p.title,
        code: p.code,
        discountType: p.discountType,
        discountValue: p.discountValue,
        description: p.description,
      }));
    } catch (err) {
      return { error: 'Không thể lấy thông tin khuyến mãi lúc này.' };
    }
  }

  /**
   * Tra cứu hồ sơ tài khoản của khách đang đăng nhập. Không bao giờ throw ra
   * ngoài — mọi lỗi (kể cả tài khoản bị khoá) trả về dạng { error } để model
   * tự diễn giải cho khách bằng ngôn ngữ tự nhiên thay vì crash cả response.
   */
  private async executeGetMyProfile(userId: number | null) {
    if (!userId) {
      return { error: 'Khách chưa đăng nhập nên không thể tra cứu thông tin tài khoản.' };
    }
    try {
      return await this.authService.getProfile(userId);
    } catch (err: any) {
      return { error: err?.message || 'Không thể lấy thông tin tài khoản lúc này.' };
    }
  }

  /**
   * Tra cứu toàn bộ đơn đặt bàn gắn với tài khoản đang đăng nhập.
   * TODO: nếu sau này có module Orders (đặt món/giao hàng) thật, bổ sung
   * thêm executeGetMyOrders() riêng — KHÔNG tận dụng dữ liệu mock trong
   * AuthService.getHistory().orders vì đó hiện là dữ liệu giả (ORD-2001...),
   * đưa cho AI dùng sẽ khiến chatbot trả lời sai sự thật cho khách.
   */
  private async executeGetMyReservations(userId: number | null) {
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
    } catch (err) {
      return { error: 'Không thể tra cứu đơn đặt bàn lúc này.' };
    }
  }

  /**
   * @param userId  nếu khách đang đăng nhập, đơn được tạo sẽ tự động gắn với
   *                tài khoản (reservationsService.create nhận userId ở tham số
   *                thứ 3) để sau này khách tra lại được qua getMyReservations.
   *                Khách vãng lai (userId null) vẫn đặt bàn được bình thường,
   *                chỉ là đơn không gắn với tài khoản nào.
   */
  private async executeCreateReservation(args: any, userId: number | null = null) {
    try {
      // Lớp an toàn: chặn ngày đặt bàn trong quá khứ (phòng khi model tính sai
      // năm dù system prompt đã cung cấp ngày hiện tại thực).
      const todayStr = new Date().toISOString().split('T')[0];
      if (args.reservationDate && args.reservationDate < todayStr) {
        return {
          status: 'error',
          message: `Ngày đặt bàn "${args.reservationDate}" đã ở trong quá khứ (hôm nay là ${todayStr}). Vui lòng xác nhận lại ngày đặt bàn chính xác với khách.`,
        };
      }

      const newReservation = await this.reservationsService.create(
        {
          customerName: args.customerName,
          phone: args.phone,
          email: args.email || undefined,
          partySize: Number(args.partySize),
          reservationDate: args.reservationDate,
          reservationTime: args.reservationTime,
          note: args.note ? `[Đặt qua AI Chatbot] ${args.note}` : '[Đặt qua AI Chatbot]',
        },
        false,
        userId || undefined,
      );
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
    } catch (err: any) {
      return {
        status: 'error',
        message: err?.message || 'Không thể khởi tạo đơn đặt bàn.',
      };
    }
  }

  private async executeEscalateToStaff(args: any, sessionId: number) {
    try {
      const session = await this.chatService.escalate(sessionId, args?.reason);
      this.chatGateway.notifyNewEscalation(session);
      return {
        status: 'success',
        message: 'Đã chuyển hội thoại cho nhân viên. Hãy báo cho khách biết nhân viên sẽ tiếp nhận trong giây lát, không tiếp tục tư vấn thêm sau bước này.',
      };
    } catch (err: any) {
      return { status: 'error', message: err?.message || 'Không thể chuyển cho nhân viên lúc này.' };
    }
  }

  private async handleFallbackMessage(msg: string, userId: number | null = null, session?: ChatSession) {
    const raw = removeAccents(msg);

    // Fallback không gọi được AI để "hiểu ý" -> nhận diện escalate bằng từ khoá cứng
    const wantsHuman =
      raw.includes('gap nhan vien') ||
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

    // 0. Khách đang đăng nhập hỏi về tài khoản / đơn của mình — xử lý trước
    // các nhánh khác vì đây là câu hỏi cá nhân hoá, cần trả lời từ dữ liệu
    // thật thay vì rơi vào các nhánh chung chung bên dưới.
    const isMyAccountQuery =
      raw.includes('tai khoan cua toi') ||
      raw.includes('thong tin cua toi') ||
      raw.includes('don cua toi') ||
      raw.includes('don dat ban cua toi') ||
      raw.includes('toi da dat ban chua') ||
      raw.includes('trang thai don');

    if (isMyAccountQuery) {
      if (!userId) {
        return {
          success: true,
          reply:
            '🔒 **Anh/Chị cần đăng nhập để tra cứu thông tin này.**\n\n' +
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
          .map(
            (r) =>
              `📅 **Đơn #${r.id}** - ${r.reservationDate} lúc ${r.reservationTime} (${r.partySize} khách)\n   Trạng thái: **${r.status}**`,
          )
          .join('\n\n');

        return {
          success: true,
          reply: `📋 **Các đơn đặt bàn gần đây của Anh/Chị:**\n\n${listStr}`,
        };
      } catch (e: any) {
        this.logger.warn(`Fallback findUserReservations failed: ${e?.message || e}`);
        return {
          success: true,
          reply: '❌ Không thể tra cứu đơn đặt bàn lúc này. Anh/Chị vui lòng thử lại sau ít phút nhé!',
        };
      }
    }

    // 1. Hỏi về Giờ mở cửa, Địa chỉ, Bãi đỗ xe
    if (
      raw.includes('gio') ||
      raw.includes('mo cua') ||
      raw.includes('may gio') ||
      raw.includes('khi nao') ||
      raw.includes('dia chi') ||
      raw.includes('o dau') ||
      raw.includes('vi tri') ||
      raw.includes('do xe') ||
      raw.includes('bai xe')
    ) {
      return {
        success: true,
        reply:
          '⏰ **Thông tin Dola Restaurant:**\n\n' +
          '• **Giờ mở cửa:** 08:00 - 22:30 mỗi ngày (Kể cả Lễ, Tết)\n' +
          '• **Địa chỉ:** 123 Đường Trần Phú, Hải Châu, Đà Nẵng\n' +
          '• **Bãi đỗ xe:** Có bãi đỗ ô tô & xe máy rộng rãi, **miễn phí** có bảo vệ trông giữ 24/7!\n' +
          '• **Hotline:** 1900 6750 | 0988 123 456',
      };
    }

    // 2. Hỏi về Khuyến mãi / Ưu đãi
    if (
      raw.includes('khuyen mai') ||
      raw.includes('uu dai') ||
      raw.includes('voucher') ||
      raw.includes('giam gia')
    ) {
      try {
        const promos = await this.executeGetPromotions();
        if (Array.isArray(promos) && promos.length > 0) {
          let listStr = promos
            .map(
              (p) =>
                `🏷️ **${p.title}** (Mã: \`${p.code}\`)\n   - ${p.description || 'Ưu đãi đặc biệt cho khách hàng đặt bàn trước'}\n`,
            )
            .join('\n');
          return {
            success: true,
            reply: `🎁 **Các Chương Trình Khuyến Mãi Đang Diễn Ra:**\n\n${listStr}\nAnh/Chị hãy nhập mã ưu đãi khi đặt bàn để nhận khuyến mãi nhé!`,
          };
        }
      } catch (e: any) {
        this.logger.warn(`Fallback getActivePromotions failed: ${e?.message || e}`);
      }

      return {
        success: true,
        reply:
          '🏷️ **Chương trình Ưu Đãi Dola Restaurant:**\n\n' +
          '• Giảm ngay **10%** cho bàn đặt trước từ 4 người qua Website.\n' +
          '• Tặng món tráng miệng đặc biệt cho khách sinh nhật trong tháng.\n' +
          '• Anh/Chị có thể xem thêm thông tin tại trang "Khuyến Mãi" của nhà hàng!',
      };
    }

    // 3. Hỏi về Món ăn / Thực đơn / Đắt nhất / Rẻ nhất / Giá cả / Ngon / Ăn no / Tối nay
    const isFoodQuery =
      raw.includes('thuc don') ||
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
      /\b\d+\s*k\b/.test(raw); // khớp "200k", "150 k"... thay vì bất kỳ chữ 'k' nào (bug cũ)

    if (isFoodQuery && !raw.includes('dat ban')) {
      try {
        const foods = await this.executeSearchFoods({});
        if (Array.isArray(foods) && foods.length > 0) {
          // Trường hợp 1: Khách hỏi món ĐẮT NHẤT
          if (raw.includes('dat nhat') || raw.includes('cao nhat')) {
            const sorted = [...foods].sort((a, b) => Number(b.price) - Number(a.price));
            const topFood = sorted[0];
            return {
              success: true,
              reply:
                `👑 **Món Ăn Cao Cấp Nhất Tại Dola Restaurant:**\n\n` +
                `🍲 **${topFood.name}**\n` +
                `• **Giá:** ${Number(topFood.price).toLocaleString('vi-VN')}đ\n` +
                `• **Danh mục:** ${topFood.category || 'Món chính'}\n` +
                `• **Mô tả:** ${topFood.description || 'Món ăn đặc sản thơm ngon hấp dẫn được chế biến công phu bởi đầu bếp hàng đầu.'}`,
            };
          }

          // Trường hợp 2: Khách hỏi món RẺ NHẤT
          if (raw.includes('re nhat') || raw.includes('thap nhat')) {
            const sorted = [...foods].sort((a, b) => Number(a.price) - Number(b.price));
            const topFood = sorted[0];
            return {
              success: true,
              reply:
                `🏷️ **Món Ăn Giá Tiết Kiệm Nhất:**\n\n` +
                `🍲 **${topFood.name}**\n` +
                `• **Giá:** ${Number(topFood.price).toLocaleString('vi-VN')}đ\n` +
                `• **Mô tả:** ${topFood.description || 'Món ăn ngon đậm đà với mức giá cực kỳ bình dân.'}`,
            };
          }

          // Trường hợp 3: Khách lọc ngân sách (ví dụ: tầm 200k trở lại)
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

          // Trường hợp 4: Gợi ý món ngon chung ("ăn no vào tối nay", "gợi ý món")
          const foodList = foods
            .slice(0, 5)
            .map(
              (f) =>
                `🍲 **${f.name}** - ${Number(f.price).toLocaleString('vi-VN')}đ\n   ${f.description ? `_${f.description}_` : ''}`,
            )
            .join('\n\n');

          return {
            success: true,
            reply: `🍽️ **Gợi Ý Thực Đơn Món Ngon Ăn No Tối Nay:**\n\n${foodList}\n\nAnh/Chị có thể chọn món và đặt bàn trước ngay với em nhé!`,
          };
        }
      } catch (e: any) {
        this.logger.warn(`Fallback searchFoods failed: ${e?.message || e}`);
      }

      return {
        success: true,
        reply:
          '🍽️ **Thực Đơn Dola Restaurant:**\n\n' +
          'Nhà hàng phục vụ đa dạng các món Á - Âu cao cấp, lẩu nướng & hải sản tươi sống.\n' +
          'Anh/Chị có thể bấm vào mục **"Thực đơn"** trên menu website để xem hình ảnh và bảng giá chi tiết ạ!',
      };
    }

    // 4. Khách nhắn thông tin Đặt bàn (Bao gồm Tên, SĐT, Gmail, Ngày, Giờ, Số lượng)
    const phoneMatch = raw.match(/(0[3|5|7|8|9][0-9]{8})/);
    const emailMatch = msg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const numPeopleMatch = raw.match(/(\d+)\s*(nguoi|khach|người|khách|ban|bàn|p)/i);

    if (phoneMatch || numPeopleMatch || raw.includes('dat ban') || raw.includes('muon dat')) {
      if (phoneMatch) {
        const phone = phoneMatch[0];
        const email = emailMatch ? emailMatch[0] : undefined;
        const partySize = numPeopleMatch ? parseInt(numPeopleMatch[1], 10) : 2;

        // Bóc tách Ngày đặt (Hỗ trợ YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, DD/MM)
        let reservationDate = new Date().toISOString().split('T')[0];
        const ymdMatch = msg.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        const dmyMatch = msg.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        const dmMatch = msg.match(/(\d{1,2})[-/](\d{1,2})/);

        if (ymdMatch) {
          const y = ymdMatch[1];
          const m = ymdMatch[2].padStart(2, '0');
          const d = ymdMatch[3].padStart(2, '0');
          reservationDate = `${y}-${m}-${d}`;
        } else if (dmyMatch) {
          const d = dmyMatch[1].padStart(2, '0');
          const m = dmyMatch[2].padStart(2, '0');
          const y = dmyMatch[3];
          reservationDate = `${y}-${m}-${d}`;
        } else if (dmMatch) {
          const d = dmMatch[1].padStart(2, '0');
          const m = dmMatch[2].padStart(2, '0');
          const y = new Date().getFullYear();
          reservationDate = `${y}-${m}-${d}`;
        }

        // Bóc tách Giờ đặt (Hỗ trợ 18:00, 18h30, 18h)
        let reservationTime = '18:30';
        const timeColonMatch = msg.match(/([0-1]?\d|2[0-3]):([0-5]\d)/);
        const timeHMatch = msg.match(/([0-1]?\d|2[0-3])[hH]([0-5]\d)?/);

        if (timeColonMatch) {
          const h = timeColonMatch[1].padStart(2, '0');
          const m = timeColonMatch[2];
          reservationTime = `${h}:${m}`;
        } else if (timeHMatch) {
          const h = timeHMatch[1].padStart(2, '0');
          const m = timeHMatch[2] ? timeHMatch[2].padStart(2, '0') : '00';
          reservationTime = `${h}:${m}`;
        }

        // Làm sạch Tên khách hàng (loại bỏ SĐT, Email, Ngày, Giờ, Số khách)
        let cleanName = msg;
        cleanName = cleanName.replace(/(0[3|5|7|8|9][0-9]{8})/g, '');
        if (email) cleanName = cleanName.replace(email, '');
        cleanName = cleanName.replace(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g, '');
        cleanName = cleanName.replace(/(\d{1,2}[-/]\d{1,2}([-/]\d{4})?)/g, '');
        cleanName = cleanName.replace(/([0-1]?\d|2[0-3])[:hH]([0-5]\d)?/gi, '');
        cleanName = cleanName.replace(/\d+\s*(nguoi|khach|người|khách|bàn|ban|p)/gi, '');
        cleanName = cleanName.replace(/[-_.,;]/g, ' ').trim();
        const customerName = cleanName.length > 0 ? cleanName.slice(0, 30) : 'Khách Hàng';

        try {
          const res = await this.executeCreateReservation(
            {
              customerName,
              phone,
              email,
              reservationDate,
              reservationTime,
              partySize,
              note: msg,
            },
            userId,
          );

          if (res.status === 'success') {
            return {
              success: true,
              reply:
                `🎉 **ĐẶT BÀN THÀNH CÔNG!**\n\n` +
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
        } catch (e: any) {
          this.logger.warn(`Fallback createReservation failed: ${e?.message || e}`);
        }
      }

      return {
        success: true,
        reply:
          '📅 **Hướng Dẫn Đặt Bàn Nhanh:**\n\n' +
          'Để đặt bàn, Anh/Chị vui lòng cung cấp thông tin theo cú pháp:\n' +
          '👉 **[Tên] - [SĐT] - [Gmail (nếu có)] - [Ngày đặt] - [Giờ đặt] - [Số khách]**\n\n' +
          'Ví dụ: _"Nguyễn Văn A 0901234567 nguyenvana@gmail.com 2026-08-10 19:00 4 người"_\n' +
          'Em sẽ tự động ghi nhận đơn đặt bàn vào hệ thống nhà hàng ngay lập tức ạ!',
      };
    }

    // 5. Trả lời mặc định thân thiện
    return {
      success: true,
      reply:
        '👋 **Chào mừng Anh/Chị đến với Dola Restaurant!**\n\n' +
        'Em có thể hỗ trợ Anh/Chị về:\n' +
        '• ⏰ **Giờ mở cửa & Địa chỉ**\n' +
        '• 🍽️ **Gợi ý thực đơn & Giá cả (Món đắt nhất, món rẻ nhất, theo ngân sách)**\n' +
        '• 🏷️ **Chương trình khuyến mãi**\n' +
        '• 📅 **Hướng dẫn Đặt bàn trước (Hỗ trợ nhập Gmail nhận xác nhận)**\n\n' +
        'Anh/Chị hãy thử bấm vào các nút gợi ý bên trên hoặc nhập câu hỏi chi tiết giúp em nhé!',
    };
  }
}