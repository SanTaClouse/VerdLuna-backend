import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.development' });

const config = {
  type: 'postgres',
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  dropSchema: true,
  logging: true,
  synchronize: true,
  entities: ['dist/**/*.entity{.js,.ts}'],
  migrations: ['dist/**/*.migrations{.js,.ts}'],
};
//---

export default registerAs('typeorm', () => config);

export const connectionSource = new DataSource(config as DataSourceOptions); //Solo se ejecuta en las migraciones
