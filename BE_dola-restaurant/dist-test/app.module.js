"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const user_entity_1 = require("./auth/entities/user.entity");
const role_entity_1 = require("./auth/entities/role.entity");
const category_entity_1 = require("./categories/entities/category.entity");
const categories_module_1 = require("./categories/categories.module");
const food_entity_1 = require("./foods/entities/food.entity");
const foods_module_1 = require("./foods/foods.module");
const food_image_entity_1 = require("./foods/entities/food-image.entity");
const review_entity_1 = require("./reviews/entities/review.entity");
const review_reply_entity_1 = require("./reviews/entities/review-reply.entity");
const reviews_module_1 = require("./reviews/reviews.module");
const news_category_entity_1 = require("./news-categories/entities/news-category.entity");
const news_categories_module_1 = require("./news-categories/news-categories.module");
const news_image_entity_1 = require("./news/entities/news-image.entity");
const news_entity_1 = require("./news/entities/news.entity");
const news_module_1 = require("./news/news.module");
const promotion_entity_1 = require("./promotions/entities/promotion.entity");
const promotions_module_1 = require("./promotions/promotions.module");
const reservation_entity_1 = require("./reservations/entities/reservation.entity");
const reservations_module_1 = require("./reservations/reservations.module");
const contacts_module_1 = require("./contacts/contacts.module");
const contact_entity_1 = require("./contacts/entities/contact.entity");
const chatbot_module_1 = require("./chatbot/chatbot.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const chat_module_1 = require("./chat/chat.module");
const chat_session_entity_1 = require("./chat/entities/chat-session.entity");
const chat_message_entity_1 = require("./chat/entities/chat-message.entity");
const table_entity_1 = require("./tables/entities/table.entity");
const tables_module_1 = require("./tables/tables.module");
const order_entity_1 = require("./orders/entities/order.entity");
const order_item_entity_1 = require("./orders/entities/order-item.entity");
const orders_module_1 = require("./orders/orders.module");
const migrationsPath = path.join(__dirname, 'migrations', '*{.ts,.js}');
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'mysql',
                    host: configService.get('DB_HOST') || 'localhost',
                    port: Number(configService.get('DB_PORT') || 3306),
                    username: configService.get('DB_USERNAME') || 'root',
                    password: configService.get('DB_PASSWORD') || 'quanvip2004',
                    database: configService.get('DB_NAME') || 'dola_restaurant',
                    entities: [user_entity_1.User, role_entity_1.Role, category_entity_1.Category, food_entity_1.Food, food_image_entity_1.FoodImage, review_entity_1.Review, review_reply_entity_1.ReviewReply, news_category_entity_1.NewsCategory, news_entity_1.News, news_image_entity_1.NewsImage, promotion_entity_1.Promotion, reservation_entity_1.Reservation, contact_entity_1.Contact, chat_session_entity_1.ChatSession, chat_message_entity_1.ChatMessage, table_entity_1.Table, order_entity_1.Order, order_item_entity_1.OrderItem],
                    migrations: [migrationsPath],
                    migrationsRun: true,
                    synchronize: false,
                    logging: false,
                }),
            }),
            auth_module_1.AuthModule,
            categories_module_1.CategoriesModule,
            foods_module_1.FoodsModule,
            reviews_module_1.ReviewsModule,
            news_categories_module_1.NewsCategoriesModule,
            news_module_1.NewsModule,
            promotions_module_1.PromotionsModule,
            reservations_module_1.ReservationsModule,
            contacts_module_1.ContactsModule,
            chatbot_module_1.ChatbotModule,
            dashboard_module_1.DashboardModule,
            chat_module_1.ChatModule,
            tables_module_1.TablesModule,
            orders_module_1.OrdersModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_PIPE,
                useClass: common_1.ValidationPipe,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map