import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private connection: mysql.Pool;

  async onModuleInit() {
    this.connection = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'quanvip2004',
      database: process.env.DB_NAME || 'dola_restaurant',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  async getConnection() {
    if (!this.connection) {
      await this.onModuleInit();
    }
    return this.connection;
  }
}
