import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
import { Role } from './auth/entities/role.entity';
import { Category } from './categories/entities/category.entity';
import { CategoriesModule } from './categories/categories.module';
import { Food } from './foods/entities/food.entity';
import { FoodsModule } from './foods/foods.module';
import { FoodImage } from './foods/entities/food-image.entity';
import { Review } from './reviews/entities/review.entity';
import { ReviewReply } from './reviews/entities/review-reply.entity';
import { ReviewsModule } from './reviews/reviews.module';
import { NewsCategory } from './news-categories/entities/news-category.entity';
import { NewsCategoriesModule } from './news-categories/news-categories.module';
import { NewsImage } from './news/entities/news-image.entity';
import { News } from './news/entities/news.entity';
import { NewsModule } from './news/news.module';
import { Promotion } from './promotions/entities/promotion.entity';
import { PromotionsModule } from './promotions/promotions.module';
import { Reservation } from './reservations/entities/reservation.entity';
import { ReservationsModule } from './reservations/reservations.module';
import { ContactsModule } from './contacts/contacts.module';
import { Contact } from './contacts/entities/contact.entity';
import { ChatbotModule } from './chatbot/chatbot.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChatModule } from './chat/chat.module';
import { ChatSession } from './chat/entities/chat-session.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { Table } from './tables/entities/table.entity';
import { TablesModule } from './tables/tables.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { MailModule } from './mail/mail.module';


const migrationsPath = path.join(__dirname, 'migrations', '*{.ts,.js}');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // bật @Cron cho PromotionsCron
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: Number(configService.get<string>('DB_PORT') || 3306),
        username: configService.get<string>('DB_USERNAME') || 'root',
        password: configService.get<string>('DB_PASSWORD') || 'quanvip2004',
        database: configService.get<string>('DB_NAME') || 'dola_restaurant',
        entities: [User, Role, Category, Food, FoodImage, Review, ReviewReply, NewsCategory, News, NewsImage, Promotion, Reservation, Contact, ChatSession, ChatMessage, Table, Order, OrderItem],
        migrations: [migrationsPath],
        migrationsRun: true,
        synchronize: false,
        logging: false,
      }),
    }),
    AuthModule,
    CategoriesModule,
    FoodsModule,
    ReviewsModule,
    NewsCategoriesModule,
    NewsModule,
    PromotionsModule,
    ReservationsModule,
    ContactsModule,
    ChatbotModule,
    DashboardModule,
    ChatModule,
    TablesModule,
    OrdersModule,
    PaymentsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule { }