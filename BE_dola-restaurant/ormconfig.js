"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
var path = require("path");
var typeorm_1 = require("typeorm");
dotenv.config({ path: path.resolve(__dirname, '.env') });
exports.default = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'quanvip2004',
    database: process.env.DB_NAME || 'dola_restaurant',
    entities: [path.join(__dirname, 'src', '**', '*.entity{.ts,.js}')],
    migrations: [path.join(__dirname, 'src', 'migrations', '*{.ts,.js}')],
    synchronize: false,
    logging: false,
});
