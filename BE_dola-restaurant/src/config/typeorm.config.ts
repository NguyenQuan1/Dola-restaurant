import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST') || 'localhost',
  port: Number(configService.get<string>('DB_PORT') || 3306),
  username: configService.get<string>('DB_USERNAME') || 'root',
  password: configService.get<string>('DB_PASSWORD') || 'quanvip2004',
  database: configService.get<string>('DB_NAME') || 'dola_restaurant',
  entities: [User, Role],
  synchronize: true,
  logging: false,
});
