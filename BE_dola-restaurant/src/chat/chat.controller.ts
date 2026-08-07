import {
  Controller, Post, Get, Patch, Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto } from './dto/send-message.dto';
import { EscalateSessionDto } from './dto/escalate-session.dto';
import { StaffSendMessageDto } from './dto/staff-send-message.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatbotService: ChatbotService,
    private readonly gateway: ChatGateway,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post('sessions')
  async createSession(@CurrentUser('userId') userId: number | null) {
    return this.chatService.createSession(userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('sessions/:id/messages')
  async sendMessage(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body() dto: SendMessageDto,
    @CurrentUser('userId') userId: number | null,
  ) {
    return this.chatbotService.handleChatMessage(dto, userId, String(sessionId));
  }

  @Get('sessions/:id/messages')
  async getMessages(@Param('id', ParseIntPipe) sessionId: number) {
    return this.chatService.findMessagesBySession(sessionId);
  }

  @Post('sessions/:id/escalate')
  async escalate(@Param('id', ParseIntPipe) sessionId: number, @Body() dto: EscalateSessionDto) {
    const session = await this.chatService.escalate(sessionId, dto.reason);
    this.gateway.notifyNewEscalation(session);
    return session;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  @Get('sessions/queue')
  async getQueue() {
    return this.chatService.findWaitingQueue();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  @Get('sessions/mine')
  async getMySessions(@CurrentUser('userId') staffId: number) {
    return this.chatService.findAssignedTo(staffId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  @Patch('sessions/:id/assign')
  async assign(@Param('id', ParseIntPipe) sessionId: number, @CurrentUser('userId') staffId: number) {
    const session = await this.chatService.assignToStaff(sessionId, staffId);
    this.gateway.notifySessionAssigned(sessionId, 'Nhân viên');
    return session;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  @Post('sessions/:id/staff-messages')
  async staffSendMessage(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body() dto: StaffSendMessageDto,
    @CurrentUser('userId') staffId: number,
  ) {
    const message = await this.chatService.addMessage(sessionId, 'staff', staffId, dto.content);
    this.gateway.broadcastMessage(sessionId, message);
    return message;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  @Patch('sessions/:id/close')
  async close(@Param('id', ParseIntPipe) sessionId: number) {
    const session = await this.chatService.closeSession(sessionId);
    this.gateway.notifySessionClosed(sessionId);
    return session;
  }
}