import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post('message')
  async handleMessage(@Body() dto: ChatMessageDto, @Req() req: any) {
    const userId: number | null = req.user?.userId ?? null;
    return this.chatbotService.handleChatMessage(dto, userId);
  }
}