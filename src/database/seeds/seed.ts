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
    const admin = await usersService.create({
      usuario: 'admin',
      password: 'admin123',
      nombre: 'Administrador',
      email: 'admin@laluna.com',
      rol: 'admin' as any,
    });
    console.log('✅ Usuario admin creado:', admin.usuario);

    // 2. Crear clientes de ejemplo
    console.log('\n📝 Creando clientes de ejemplo...');
    const clientes = await clienteRepo.save([
      {
        nombre: 'Verdulería El Sol',
        direccion: 'San Martín 456, Maciel',
        telefono: '3434569846',
        email: 'elsol@example.com',
      },
      {
        nombre: 'Almacén Don Pedro',
        direccion: 'Belgrano 789, Maciel',
        telefono: '3434569847',
      },
      {
        nombre: 'Supermercado Central',
        direccion: 'Mitre 123, Maciel',
        telefono: '3434569848',
        email: 'central@example.com',
      },
    ]);
    console.log(`✅ ${clientes.length} clientes creados\n`);

    console.log('🎉 Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - 1 usuario admin`);
    console.log(`   - ${clientes.length} clientes de ejemplo`);
    console.log('\n💡 Credenciales de login:');
    console.log('   Usuario: admin');
    console.log('   Password: admin123\n');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
