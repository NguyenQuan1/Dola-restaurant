import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'quanvip2004',
  database: process.env.DB_NAME || 'dola_restaurant',

  entities: [
    path.join(__dirname, process.env.NODE_ENV === 'production' ? '../**/*.entity.js' : '../**/*.entity.ts'),
  ],

  migrations: [
    path.join(__dirname, process.env.NODE_ENV === 'production' ? '../migrations/*.js' : '../migrations/*.ts'),
  ],

  synchronize: false,
  logging: false,
});