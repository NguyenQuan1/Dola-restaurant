import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { FoodsModule } from '../foods/foods.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ConfigModule, FoodsModule, ReservationsModule, PromotionsModule, AuthModule, forwardRef(() => ChatModule)],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule { }