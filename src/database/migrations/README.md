# Migraciones de Base de Datos

Este directorio contiene las migraciones de TypeORM para gestionar cambios en la base de datos de forma controlada.

## Comandos disponibles

### Ver migraciones pendientes
```bash
npm run migration:show
```

### Ejecutar migraciones pendientes
```bash
npm run migration:run
```

### Revertir última migración
```bash
npm run migration:revert
```

### Crear nueva migración manualmente
```bash
npm run migration:create src/database/migrations/NombreDeLaMigracion
```

### Generar migración automáticamente (detecta cambios en entities)
```bash
npm run migration:generate src/database/migrations/NombreDeLaMigracion
```

## Flujo de trabajo

### 1. Para el primer deploy en producción:

```bash
# 1. Asegúrate que dropSchema esté en false en producción
# 2. Ejecutar migraciones para crear usuarios admin
npm run migration:run
```

### 2. Para modificar usuarios en el futuro SIN perder datos:

**Opción A - Editar la migración existente:**
```bash
# 1. Editar src/database/migrations/1700000000000-SeedAdminUsers.ts
# 2. Cambiar los valores de nombre, email, etc.
# 3. Revertir la migración anterior
npm run migration:revert

# 4. Ejecutar la migración actualizada
npm run migration:run
```

**Opción B - Crear nueva migración (RECOMENDADO):**
```bash
# 1. Crear nueva migración
npm run migration:create src/database/migrations/UpdateAdminUsers

# 2. Editar el archivo creado con UPDATE queries
# 3. Ejecutar la nueva migración
npm run migration:run
```

### 3. Para agregar una columna nueva a una tabla:

```bash
# 1. Modificar la entity (ej: user.entity.ts)
# 2. Generar migración automáticamente
npm run migration:generate src/database/migrations/AddTelefonoToUser

# 3. Revisar el archivo generado
# 4. Ejecutar la migración
npm run migration:run
```

## Notas importantes

- **NUNCA** usar `dropSchema: true` en producción
- Las migraciones son **irreversibles** en producción (usa `down()` con cuidado)
- Siempre revisar el SQL generado antes de ejecutar en producción
- La tabla `migrations` registra qué migraciones ya se ejecutaron
- Las migraciones se ejecutan en orden cronológico por timestamp

## Migración inicial

**1700000000000-SeedAdminUsers.ts**
- Crea 4 usuarios admin
- Contraseña: `admin123`
- Es **idempotente**: se puede ejecutar múltiples veces
- Si los usuarios ya existen, los actualiza (ON CONFLICT DO UPDATE)

## Variables de entorno

Para controlar `dropSchema` en desarrollo:

```env
# .env.development
NODE_ENV=development
DROP_SCHEMA=true  # Solo si quieres que borre la DB al reiniciar
```

En producción (Render):
```env
NODE_ENV=production
# NO agregar DROP_SCHEMA - nunca se ejecutará dropSchema
```
