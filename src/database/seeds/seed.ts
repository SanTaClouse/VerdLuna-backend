import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../modules/users/users.service';
import { DataSource } from 'typeorm';
import { Cliente } from '../../modules/cliente/entities/cliente.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Servicios
    const usersService = app.get(UsersService);
    const dataSource = app.get(DataSource);
    const clienteRepo = dataSource.getRepository(Cliente);

    console.log('🌱 Iniciando seed...\n');

    // 1. Crear usuario admin
    console.log('📝 Creando usuario admin...');
    const admin1 = await usersService.create({
      usuario: 'Admin-pablo',
      password: 'Admin.Luna123',
      nombre: 'Pablo',
      email: 'admin@laluna.com',
      rol: 'admin' as any,
    });
    console.log('✅ Usuario admin creado:', admin1.usuario);

    console.log('📝 Creando usuario admin...');
    const admin2 = await usersService.create({
      usuario: 'Admin-martin',
      password: 'Admin.Luna123',
      nombre: 'Martin',
      email: 'admin2@laluna.com',
      rol: 'admin' as any,
    });
    console.log('✅ Usuario admin creado:', admin2.usuario);

    console.log('📝 Creando usuario admin...');
    const admin3 = await usersService.create({
      usuario: 'Admin-Tomas',
      password: 'Admin.Luna123',
      nombre: 'Tomas',
      email: 'admin3@laluna.com',
      rol: 'admin' as any,
    });
    console.log('✅ Usuario admin creado:', admin3.usuario);

    console.log('📝 Creando usuario admin...');
    const admin4 = await usersService.create({
      usuario: 'admin4',
      password: 'Admin.Luna123',
      nombre: 'Administrador 4',
      email: 'admin4@laluna.com',
      rol: 'admin' as any,
    });
    console.log('✅ Usuario admin creado:', admin4.usuario);



    console.log('🎉 Seed completado exitosamente!');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
