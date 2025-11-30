# 🚀 Guía de Migraciones - Backoffice Luna

## ✅ ¿Qué se configuró?

### 1. Sistema de migraciones TypeORM
- ✅ Configuración modularizada en `src/config/typeorm.ts`
- ✅ Scripts de migraciones en `package.json`
- ✅ Control de `dropSchema` mediante variable de entorno
- ✅ Migración inicial para usuarios admin

### 2. Archivos creados/modificados

**Modificados:**
- `src/config/typeorm.ts` - Configuración para migraciones + DataSource
- `package.json` - Scripts de migraciones
- `.env.development` - Variable `DROP_SCHEMA=false`

**Creados:**
- `src/database/migrations/1700000000000-SeedAdminUsers.ts` - Migración inicial
- `src/database/migrations/README.md` - Documentación de migraciones

---

## 📋 Plan de Deploy a Producción

### Paso 1: Preparar para deploy
```bash
# En desarrollo, asegúrate que DROP_SCHEMA esté en false
# Verifica .env.development:
DROP_SCHEMA=false

# Hacer commit de todos los cambios
git add .
git commit -m "feat: configurar sistema de migraciones"
git push
```

### Paso 2: Deploy en Render

**Variables de entorno en Render:**
```env
NODE_ENV=production
DATABASE_HOST=tu-host-postgres
DATABASE_PORT=5432
DATABASE_USER=tu-usuario
DATABASE_PASS=tu-password
DATABASE_NAME=tu-database
JWT_SECRET=tu-secret-seguro
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://tu-frontend.com

# NO agregar DROP_SCHEMA - en producción NUNCA debe existir
```

### Paso 3: Ejecutar migraciones en producción

**Opción A - Desde Render Shell:**
```bash
# Conectarte al shell de Render
npm run migration:run
```

**Opción B - Script de build en Render:**
Agregar a `package.json`:
```json
{
  "scripts": {
    "build": "nest build && npm run migration:run"
  }
}
```

### Paso 4: Verificar usuarios creados
Los usuarios creados por la migración:
- `admin1` / `admin123` (admin@laluna.com)
- `admin2` / `admin123` (admin2@laluna.com)
- `admin3` / `admin123` (admin3@laluna.com)
- `admin4` / `admin123` (admin4@laluna.com)

---

## 🔧 Comandos de Migraciones

### Ver estado de migraciones
```bash
npm run migration:show
```
Muestra:
- ✅ Migraciones ejecutadas
- ⏳ Migraciones pendientes

### Ejecutar migraciones pendientes
```bash
npm run migration:run
```

### Revertir última migración
```bash
npm run migration:revert
```

### Crear migración manualmente
```bash
npm run migration:create src/database/migrations/MiNuevaMigracion
```

### Generar migración automática
```bash
# 1. Modificar una entity (ej: user.entity.ts)
# 2. Generar migración
npm run migration:generate src/database/migrations/AddTelefonoToUser
```

---

## 📝 Casos de uso

### Caso 1: Modificar datos de usuarios admin existentes

**Sin perder otros datos de la DB:**

```bash
# 1. Crear nueva migración
npm run migration:create src/database/migrations/UpdateAdminEmails

# 2. Editar el archivo creado:
```
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAdminEmails1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users
      SET email = 'nuevoemail@laluna.com', "updatedAt" = NOW()
      WHERE usuario = 'admin1'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users
      SET email = 'admin@laluna.com', "updatedAt" = NOW()
      WHERE usuario = 'admin1'
    `);
  }
}
```

```bash
# 3. Ejecutar migración
npm run migration:run
```

### Caso 2: Agregar columna "teléfono" a usuarios

```bash
# 1. Modificar user.entity.ts
@Column({ nullable: true })
telefono?: string;

# 2. Generar migración automática
npm run migration:generate src/database/migrations/AddTelefonoToUser

# 3. Revisar el archivo generado (TypeORM lo creó por ti)

# 4. Ejecutar
npm run migration:run
```

### Caso 3: Agregar un nuevo usuario admin

```bash
# 1. Crear migración
npm run migration:create src/database/migrations/AddAdmin5

# 2. Editar:
```
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class AddAdmin51234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await queryRunner.query(`
      INSERT INTO users (id, usuario, password, nombre, email, rol, activo, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'admin5', '${hashedPassword}', 'Administrador 5', 'admin5@laluna.com', 'admin', true, NOW(), NOW())
      ON CONFLICT (usuario) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE usuario = 'admin5'`);
  }
}
```

```bash
# 3. Ejecutar
npm run migration:run
```

---

## ⚠️ Importantes

### ❌ NUNCA hacer esto en producción:
```typescript
dropSchema: true  // Esto borrará toda tu base de datos
```

### ✅ Configuración segura:
```typescript
// typeorm.ts
dropSchema: configService.get('NODE_ENV') === 'development' &&
            configService.get('DROP_SCHEMA') === 'true',
```

Esto significa:
- En **desarrollo**: solo borra si `DROP_SCHEMA=true` en `.env.development`
- En **producción**: NUNCA borra (porque `NODE_ENV=production`)

### 🔐 Seguridad de contraseñas

Las contraseñas en las migraciones se hashean con bcrypt:
```typescript
const hashedPassword = await bcrypt.hash('admin123', 10);
```

**IMPORTANTE**: Después del primer deploy, cambia las contraseñas desde la aplicación.

---

## 🐛 Troubleshooting

### Error: "migrations table doesn't exist"
```bash
# La primera vez que ejecutes migraciones, TypeORM crea la tabla automáticamente
npm run migration:run
```

### Error: "migration already executed"
```bash
# Ver qué migraciones ya se ejecutaron
npm run migration:show
```

### Quiero resetear la base de datos en desarrollo
```bash
# Opción 1: Usando dropSchema
# En .env.development:
DROP_SCHEMA=true
# Reiniciar el servidor

# Opción 2: Revertir todas las migraciones
npm run migration:revert  # Repetir hasta revertir todas
```

---

## 📚 Recursos

- [TypeORM Migrations Docs](https://typeorm.io/migrations)
- [NestJS Database](https://docs.nestjs.com/techniques/database)
- Documentación interna: `src/database/migrations/README.md`

---

## 🎯 Resumen rápido

**Para deploy inicial en producción:**
```bash
npm run migration:run
```

**Para modificar usuarios sin perder datos:**
```bash
npm run migration:create src/database/migrations/MiCambio
# Editar el archivo
npm run migration:run
```

**Para agregar columnas a tablas:**
```bash
# Modificar entity
npm run migration:generate src/database/migrations/MiCambio
npm run migration:run
```

¡Listo! 🚀
