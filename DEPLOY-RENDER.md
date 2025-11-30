# 🚀 Guía de Deploy en Render

## 📋 Configuración Inicial en Render

### 1. Crear Web Service en Render

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configuración:
   - **Name**: `backoffice-luna-api` (o el nombre que prefieras)
   - **Environment**: `Node`
   - **Region**: Selecciona la más cercana a tu ubicación
   - **Branch**: `main` (o la rama que uses)
   - **Root Directory**: `back`

### 2. Configurar Build & Deploy

En la configuración del Web Service:

#### Build Command:
```bash
npm install && npm run build:prod
```

**Importante:** Usa `build:prod` en lugar de `build` porque:
- `build:prod` = compila el código **Y** ejecuta las migraciones automáticamente
- Esto asegura que los usuarios admin se creen en el primer deploy

#### Start Command:
```bash
npm run start:prod
```

### 3. Variables de Entorno en Render

Ve a la sección "Environment" y agrega estas variables:

```env
NODE_ENV=production
PORT=3000

# Database - PostgreSQL de Render
DATABASE_HOST=<tu-host-postgres>.render.com
DATABASE_PORT=5432
DATABASE_USER=<tu-usuario>
DATABASE_PASS=<tu-password>
DATABASE_NAME=<tu-database>

# JWT
JWT_SECRET=<genera-un-secret-seguro-random>
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://tu-frontend.onrender.com

# NO agregar DROP_SCHEMA - en producción NUNCA debe existir
```

#### ⚠️ Importante sobre DROP_SCHEMA:
- **NUNCA** agregues `DROP_SCHEMA` en producción
- Solo existe en `.env.development` para desarrollo local
- En producción, la ausencia de esta variable evita que se borre la DB

#### 🔐 Generar JWT_SECRET seguro:
```bash
# En tu terminal local:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Crear PostgreSQL Database

1. En Render Dashboard → "New +" → "PostgreSQL"
2. Configuración:
   - **Name**: `backoffice-luna-db`
   - **Database**: `backoffice_luna`
   - **User**: Se genera automáticamente
   - **Region**: La misma que tu Web Service
   - **Plan**: Free (o el que necesites)

3. Copia las credenciales generadas:
   - **Internal Database URL**: Para conectar desde Render
   - **External Database URL**: Para conectar desde tu computadora (pgAdmin, DBeaver, etc.)

4. Usa estas credenciales en las variables de entorno del Web Service

---

## 🔄 Formas de Ejecutar Migraciones

### Opción 1: Automática en cada Deploy (CONFIGURADA)

✅ **Ya está configurada** con el script `build:prod`

**Ventajas:**
- Automático, no requiere intervención manual
- Se ejecuta siempre que hagas deploy
- Ideal para el primer deploy

**Desventajas:**
- Se ejecuta en cada deploy (aunque si las migraciones ya corrieron, no hace nada)

**Cómo funciona:**
```bash
# En Render, cuando haces deploy:
npm install && npm run build:prod
# ↓
# nest build && npm run migration:run:prod
# ↓
# Se ejecutan las migraciones pendientes
```

---

### Opción 2: Manual desde Render Shell

Para ejecutar migraciones manualmente DESPUÉS del deploy:

1. En Render Dashboard → Tu Web Service
2. Click en "Shell" (pestaña superior)
3. Ejecuta:
```bash
npm run migration:run:prod
```

**Cuándo usarlo:**
- Cuando quieras control total sobre cuándo se ejecutan
- Para ejecutar migraciones adicionales sin hacer redeploy
- Para verificar qué migraciones están pendientes

**Comandos útiles en Shell:**
```bash
# Ver estado de migraciones
npm run typeorm:prod -- migration:show -d dist/config/typeorm.js

# Ejecutar migraciones pendientes
npm run migration:run:prod

# Revertir última migración (cuidado en producción!)
npm run typeorm:prod -- migration:revert -d dist/config/typeorm.js
```

---

### Opción 3: Desactivar Auto-ejecución (Si lo prefieres)

Si NO quieres que las migraciones se ejecuten automáticamente:

1. En Render, cambia el **Build Command** a:
```bash
npm install && npm run build
```

2. Luego ejecuta migraciones manualmente cuando quieras:
```bash
# Desde Render Shell:
npm run migration:run:prod
```

---

## 📝 Primer Deploy - Checklist

### Antes de hacer deploy:

- [ ] Hacer commit de todos los cambios
- [ ] Verificar que `DROP_SCHEMA=false` en `.env.development`
- [ ] Verificar que la migración `1700000000000-SeedAdminUsers.ts` existe
- [ ] Push a GitHub

### En Render:

- [ ] Crear PostgreSQL Database
- [ ] Crear Web Service
- [ ] Configurar todas las variables de entorno (sin DROP_SCHEMA)
- [ ] Build Command: `npm install && npm run build:prod`
- [ ] Start Command: `npm run start:prod`
- [ ] Deploy!

### Después del primer deploy:

1. Verifica que el servidor está corriendo:
   - URL: `https://tu-app.onrender.com/api`
   - Debería responder con un mensaje

2. Verifica las migraciones:
   - Ve a Shell en Render
   - Ejecuta: `npm run typeorm:prod -- migration:show -d dist/config/typeorm.js`
   - Deberías ver `SeedAdminUsers` como ejecutada

3. Prueba el login:
   - URL: `https://tu-app.onrender.com/api/auth/login`
   - Usuario: `admin1` / Password: `admin123`

---

## 🔒 Usuarios Admin Creados

La migración crea 4 usuarios admin:

| Usuario | Password | Email |
|---------|----------|-------|
| admin1 | admin123 | admin@laluna.com |
| admin2 | admin123 | admin2@laluna.com |
| admin3 | admin123 | admin3@laluna.com |
| admin4 | admin123 | admin4@laluna.com |

**⚠️ IMPORTANTE:** Después del primer login exitoso, cambia las contraseñas desde la aplicación.

---

## 🔧 Modificar Usuarios Admin en el Futuro

### Opción A: Crear nueva migración (RECOMENDADO)

```bash
# Local:
npm run migration:create src/database/migrations/UpdateAdminPasswords

# Editar el archivo creado:
```

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class UpdateAdminPasswords1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const newPassword = await bcrypt.hash('nueva-contraseña-segura', 10);

    await queryRunner.query(`
      UPDATE users
      SET password = '${newPassword}', "updatedAt" = NOW()
      WHERE usuario IN ('admin1', 'admin2', 'admin3', 'admin4')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir si es necesario
  }
}
```

```bash
# Hacer commit y push
git add .
git commit -m "feat: actualizar contraseñas admin"
git push

# Render detecta el cambio y hace redeploy
# Las migraciones se ejecutan automáticamente
```

### Opción B: Editar migración existente (Solo ANTES del primer deploy)

Si aún NO hiciste el primer deploy, puedes editar `1700000000000-SeedAdminUsers.ts` directamente.

---

## 📊 Monitoreo

### Ver logs en tiempo real:
1. Render Dashboard → Tu Web Service → "Logs"
2. Verás mensajes como:
   - `🟢 Login exitoso - admin1`
   - `🔴 Login fallido: usuario no encontrado - admin5`

### Verificar base de datos:
1. Conecta con pgAdmin o DBeaver usando la **External Database URL**
2. Verifica que existen las tablas:
   - `users`
   - `clientes`
   - `pedidos`
   - `migrations` (tabla de TypeORM que registra migraciones ejecutadas)

---

## 🆘 Troubleshooting

### Error: "migrations already executed"
✅ Normal. Las migraciones son idempotentes, solo se ejecutan una vez.

### Error: "Cannot find module 'typeorm'"
```bash
# En Render Shell:
npm install
npm run migration:run:prod
```

### Quiero resetear la base de datos en producción
⚠️ **CUIDADO:** Esto borrará TODOS los datos.

```bash
# En Render Shell:
npm run typeorm:prod -- migration:revert -d dist/config/typeorm.js
# Repite hasta revertir todas
```

Luego:
```bash
npm run migration:run:prod
```

### No puedo acceder al Shell de Render
- Asegúrate de que el servicio está corriendo (status: "Live")
- Si está en "Failed", revisa los logs para ver el error

---

## 🎯 Resumen Rápido

**Para el primer deploy:**
```bash
# Local:
git push origin main

# Render hace automáticamente:
# 1. npm install
# 2. npm run build:prod
#    ↳ nest build
#    ↳ npm run migration:run:prod (crea usuarios admin)
# 3. npm run start:prod
```

**Para deploys futuros:**
- Cualquier cambio que pushees a GitHub → Render redeploya automáticamente
- Si agregaste nuevas migraciones → Se ejecutan automáticamente en el build

**Para ejecutar migraciones manualmente:**
```bash
# Render Shell:
npm run migration:run:prod
```

¡Listo! 🚀
