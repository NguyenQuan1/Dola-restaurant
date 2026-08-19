"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeOrmConfig = void 0;
const user_entity_1 = require("../auth/entities/user.entity");
const role_entity_1 = require("../auth/entities/role.entity");
const getTypeOrmConfig = (configService) => ({
    type: 'mysql',
    host: configService.get('DB_HOST') || 'localhost',
    port: Number(configService.get('DB_PORT') || 3306),
    username: configService.get('DB_USERNAME') || 'root',
    password: configService.get('DB_PASSWORD') || 'quanvip2004',
    database: configService.get('DB_NAME') || 'dola_restaurant',
    entities: [user_entity_1.User, role_entity_1.Role],
    synchronize: true,
    logging: false,
});
exports.getTypeOrmConfig = getTypeOrmConfig;
//# sourceMappingURL=typeorm.config.js.map