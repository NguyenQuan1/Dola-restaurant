import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, ChatSenderType } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
  ) {}

  // ── Session ──────────────────────────────

  async createSession(userId: number | null, guestName?: string, guestPhone?: string): Promise<ChatSession> {
    const session = this.sessionRepo.create({
      userId,
      guestName: guestName || null,
      guestPhone: guestPhone || null,
      status: 'ai',
    });
    return this.sessionRepo.save(session);
  }

  async findSessionById(id: number): Promise<ChatSession> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Không tìm thấy phiên chat');
    return session;
  }

  async findWaitingQueue(): Promise<ChatSession[]> {
    return this.sessionRepo.find({
      where: { status: 'waiting_staff' },
      order: { lastMessageAt: 'ASC' },
      relations: { user: true },
    });
  }

  async findAssignedTo(staffId: number): Promise<ChatSession[]> {
    return this.sessionRepo.find({
      where: { assignedStaffId: staffId, status: 'staff' },
      order: { lastMessageAt: 'DESC' },
      relations: { user: true },
    });
  }

  async escalate(sessionId: number, reason?: string): Promise<ChatSession> {
    const session = await this.findSessionById(sessionId);
    if (session.status === 'closed') {
      throw new BadRequestException('Phiên chat đã đóng, không thể chuyển tiếp');
    }
    session.status = 'waiting_staff';
    session.escalationReason = reason || session.escalationReason;
    return this.sessionRepo.save(session);
  }

  async assignToStaff(sessionId: number, staffId: number): Promise<ChatSession> {
    const session = await this.findSessionById(sessionId);
    if (session.status !== 'waiting_staff') {
      throw new BadRequestException('Phiên chat không ở trạng thái chờ xử lý');
    }
    session.status = 'staff';
    session.assignedStaffId = staffId;
    return this.sessionRepo.save(session);
  }

  async closeSession(sessionId: number): Promise<ChatSession> {
    const session = await this.findSessionById(sessionId);
    session.status = 'closed';
    return this.sessionRepo.save(session);
  }

  async touchSession(sessionId: number): Promise<void> {
    await this.sessionRepo.update(sessionId, { lastMessageAt: new Date() });
  }

  // ── Message ──────────────────────────────

  async addMessage(sessionId: number, senderType: ChatSenderType, senderId: number | null, content: string): Promise<ChatMessage> {
    const message = this.messageRepo.create({ sessionId, senderType, senderId, content });
    const saved = await this.messageRepo.save(message);
    await this.touchSession(sessionId);
    return saved;
  }

  async findMessagesBySession(sessionId: number): Promise<ChatMessage[]> {
    return this.messageRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }
}