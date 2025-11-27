import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.development' });

const config = {
  type: 'postgres',
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  dropSchema: true,
  logging: true,
  synchronize: true,
  entities: ['dist/**/*.entity{.js,.ts}'],
  migrations: ['dist/**/*.migrations{.js,.ts}'],
};
//---

export default registerAs('typeorm', () => config);

export const connectionSource = new DataSource(config as DataSourceOptions); //Solo se ejecuta en las migraciones
