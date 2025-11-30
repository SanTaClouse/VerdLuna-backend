import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';

// Cargar variables de entorno para migraciones
if (process.env.NODE_ENV !== 'production') {
  dotenvConfig({ path: '.env.development' });
}

// Configuración para la aplicación NestJS
export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get<number>('DATABASE_PORT'),
  username: configService.get('DATABASE_USER'),
  password: configService.get('DATABASE_PASS'),
  database: configService.get('DATABASE_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: configService.get('NODE_ENV') === 'development', // Solo en desarrollo
  logging: configService.get('NODE_ENV') === 'development',
  autoLoadEntities: true,
  dropSchema: configService.get('NODE_ENV') === 'development' &&
              configService.get('DROP_SCHEMA') === 'true', // Solo si está explícitamente activado
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsRun: false, // No ejecutar migraciones automáticamente
});

// Configuración para las migraciones CLI (typeorm-cli)
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false, // NUNCA usar synchronize con migraciones
  logging: process.env.NODE_ENV !== 'production',
};

// DataSource para ejecutar migraciones con TypeORM CLI
export const AppDataSource = new DataSource(dataSourceOptions);
