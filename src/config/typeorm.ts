import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';

// Solo cargar .env.development en desarrollo, en producción usar variables de entorno de Render
if (process.env.NODE_ENV !== 'production') {
  dotenvConfig({ path: '.env.development' });
}

const config = {
  type: 'postgres',
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 5432,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS, // Cambiado de DATABASE_PASS a DATABASE_PASSWORD
  dropSchema: false, // NUNCA dropear en producción
  logging: process.env.NODE_ENV !== 'production',
  synchronize: true, // TODO: Cambiar a false después del primer deploy exitoso
  entities: ['dist/**/*.entity{.js,.ts}'],
  migrations: ['dist/**/*.migrations{.js,.ts}'],
};
//---

export default registerAs('typeorm', () => config);

export const connectionSource = new DataSource(config as DataSourceOptions); //Solo se ejecuta en las migraciones
