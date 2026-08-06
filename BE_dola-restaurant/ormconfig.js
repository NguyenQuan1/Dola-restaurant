const dotenv = require('dotenv');
const path = require('path');
const { DataSource } = require('typeorm');
const { User } = require('./dist/src/auth/entities/user.entity');
const { Role } = require('./dist/src/auth/entities/role.entity');

dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dola_restaurant',
  entities: [User, Role],
  migrations: [path.join(__dirname, 'dist', 'src', 'migrations', '*.js')],
  synchronize: false,
  logging: false,
});
