import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedAdminUsers1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hash de las contraseñas
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insertar usuarios admin
    // Usando INSERT con ON CONFLICT para que sea idempotente (se puede ejecutar múltiples veces sin error)
    await queryRunner.query(`
      INSERT INTO users (id, usuario, password, nombre, email, rol, activo, "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), 'admin1', '${hashedPassword}', 'Administrador 1', 'admin@laluna.com', 'admin', true, NOW(), NOW()),
        (gen_random_uuid(), 'admin2', '${hashedPassword}', 'Administrador 2', 'admin2@laluna.com', 'admin', true, NOW(), NOW()),
        (gen_random_uuid(), 'admin3', '${hashedPassword}', 'Administrador 3', 'admin3@laluna.com', 'admin', true, NOW(), NOW()),
        (gen_random_uuid(), 'admin4', '${hashedPassword}', 'Administrador 4', 'admin4@laluna.com', 'admin', true, NOW(), NOW())
      ON CONFLICT (usuario) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        rol = EXCLUDED.rol,
        activo = EXCLUDED.activo,
        "updatedAt" = NOW()
    `);

    console.log('✅ Usuarios admin creados/actualizados correctamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir: eliminar los usuarios admin
    await queryRunner.query(`
      DELETE FROM users
      WHERE usuario IN ('admin1', 'admin2', 'admin3', 'admin4')
    `);

    console.log('⏪ Usuarios admin eliminados');
  }
}
