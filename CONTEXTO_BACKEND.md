# Contexto del Backend - BackOffice System Luna

## 📋 Estado Actual del Proyecto

**Fecha:** 27 de Noviembre 2025
**Progreso:** 60% completado
**Siguiente paso:** Implementar módulo Auth (JWT + Guards)

---

## ✅ Lo que YA ESTÁ HECHO

### 1. Configuración Base
- ✅ Proyecto NestJS inicializado
- ✅ Todas las dependencias instaladas (`npm install` ejecutado exitosamente)
- ✅ TypeScript configurado con `strict: true`
- ✅ Variables de entorno en `.env.development`

### 2. Entidades TypeORM Creadas

**Ubicación:** `src/modules/`

#### User Entity (`users/entities/user.entity.ts`)
```typescript
- id: uuid
- usuario: string (unique, indexed)
- password: string (hash bcrypt)
- nombre: string (opcional)
- email: string (unique, indexed, opcional)
- rol: enum('admin', 'vendedor')
- activo: boolean
- createdAt, updatedAt
- Relación: OneToMany → Pedidos
```

#### Cliente Entity (`cliente/entities/cliente.entity.ts`)
```typescript
- id: uuid
- nombre: string (indexed)
- direccion: string
- telefono: string (indexed)
- email: string (opcional)
- descripcion: text (opcional)
- estado: enum('Activo', 'Inactivo')
- totalFacturado: decimal(10,2)
- cantidadPedidos: integer
- ultimoPedido: date
- fechaRegistro, updatedAt
- isDeleted: boolean (soft delete)
- fechaBaja: timestamp
- Relación: OneToMany → Pedidos
```

#### Pedido Entity (`pedidos/entities/pedido.entity.ts`)
```typescript
- id: uuid
- clienteId: uuid (indexed, FK)
- descripcion: text
- precio: decimal(10,2)
- precioAbonado: decimal(10,2)
- estado: enum('Pago', 'Impago') [calculado automáticamente]
- fecha: date (indexed)
- creadoPorId: uuid (FK, opcional)
- createdAt, updatedAt (indexed)
- Relación: ManyToOne → Cliente (eager: true)
- Relación: ManyToOne → User
- Hook: @BeforeInsert/@BeforeUpdate calcularEstado()
- Constraint: CHECK (precioAbonado <= precio)
```

### 3. Base de Datos PostgreSQL
- ✅ Base de datos `backoffice_luna` creada
- ✅ Tablas creadas automáticamente con `synchronize: true`
- ✅ Índices aplicados
- ✅ Foreign Keys configuradas
- ✅ ENUMs creados

### 4. Configuración Main.ts
**Ubicación:** `src/main.ts`

✅ Configurado:
- CORS habilitado (origin: http://localhost:5173)
- Global prefix: `/api`
- ValidationPipe global (whitelist, forbidNonWhitelisted, transform)
- Swagger en `/api/docs`
- Bearer Auth configurado en Swagger

### 5. App Module
**Ubicación:** `src/app.module.ts`

✅ Configurado:
- ConfigModule global
- TypeORM con configuración async
- PedidosModule importado
- ClienteModule importado

### 6. Variables de Entorno
**Ubicación:** `.env.development`

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=backoffice_luna
JWT_SECRET=tu_secret_key_muy_segura_cambiar_en_produccion_2025
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

---

## ❌ Lo que FALTA IMPLEMENTAR

### 1. Módulo de Autenticación (CRÍTICO - Prioridad 1)

**Crear estructura:**
```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   └── jwt.strategy.ts
├── guards/
│   └── jwt-auth.guard.ts
└── dto/
    ├── login.dto.ts
    └── login-response.dto.ts
```

**Endpoints requeridos:**
```typescript
POST /api/auth/login
- Body: { usuario: string, password: string }
- Response: { success: boolean, user: User, token: string }

GET /api/auth/verify
- Headers: Authorization: Bearer <token>
- Response: { success: boolean, user: User }
```

**Dependencias necesarias:**
- @nestjs/jwt
- @nestjs/passport
- passport
- passport-jwt
- bcrypt
- @types/passport-jwt
- @types/bcrypt

✅ Ya instaladas en package.json

---

### 2. Módulo Users (CRÍTICO - Prioridad 1)

**Crear estructura:**
```
src/modules/users/
├── users.module.ts
├── users.controller.ts (opcional para MVP)
├── users.service.ts
├── dto/
│   └── create-user.dto.ts
└── entities/
    └── user.entity.ts ✅ (ya existe)
```

**Funcionalidad mínima:**
- `findByUsuario(usuario: string)` - para login
- `create(userData)` - para crear usuarios (admin)
- `hashPassword(password: string)` - bcrypt
- `validatePassword(plain, hash)` - verificación

---

### 3. DTOs con Validaciones (Prioridad 2)

#### Cliente DTOs

**create-cliente.dto.ts:**
```typescript
export class CreateClienteDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 150)
  nombre: string;

  @IsNotEmpty()
  @IsString()
  direccion: string;

  @IsNotEmpty()
  @Matches(/^[0-9\s\-\+\(\)]+$/)
  telefono: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
```

**update-cliente.dto.ts:**
```typescript
export class UpdateClienteDto extends PartialType(CreateClienteDto) {}
```

#### Pedido DTOs

**create-pedido.dto.ts:**
```typescript
export class CreatePedidoDto {
  @IsNotEmpty()
  @IsUUID()
  clienteId: string;

  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  precio: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioAbonado?: number;

  @IsNotEmpty()
  @IsDateString()
  fecha: string; // YYYY-MM-DD
}
```

**filtros-pedidos.dto.ts:**
```typescript
export class FiltrosPedidosDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsEnum(['Pago', 'Impago', 'Todos'])
  estado?: 'Pago' | 'Impago' | 'Todos';

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
```

**update-estado-pedido.dto.ts:**
```typescript
export class UpdateEstadoPedidoDto {
  @IsNotEmpty()
  @IsEnum(['Pago', 'Impago'])
  estado: 'Pago' | 'Impago';
}
```

---

### 4. Servicios con Lógica de Negocio (Prioridad 2)

#### ClientesService

**Métodos requeridos:**
```typescript
async findAll(): Promise<Cliente[]>
async findOne(id: string): Promise<Cliente>
async create(createDto: CreateClienteDto): Promise<Cliente>
async update(id: string, updateDto: UpdateClienteDto): Promise<Cliente>
async remove(id: string): Promise<void> // soft delete
async actualizarEstadisticas(clienteId: string): Promise<void>
```

**Lógica de `actualizarEstadisticas`:**
```typescript
// Debe actualizar automáticamente:
- totalFacturado (suma de pedidos.precio)
- cantidadPedidos (count de pedidos)
- ultimoPedido (max fecha de pedidos)
```

#### PedidosService

**Métodos requeridos:**
```typescript
async create(createDto: CreatePedidoDto, userId?: string): Promise<Pedido>
async findAll(filtros: FiltrosPedidosDto): Promise<Pedido[]>
async findOne(id: string): Promise<Pedido>
async updateEstado(id: string, updateDto: UpdateEstadoPedidoDto): Promise<Pedido>
async remove(id: string): Promise<void>
async getEstadisticas(filtros: FiltrosPedidosDto): Promise<EstadisticasDto>
```

**Lógica especial:**
- Al crear pedido → llamar `clientesService.actualizarEstadisticas(clienteId)`
- Al eliminar pedido → llamar `clientesService.actualizarEstadisticas(clienteId)`
- `getEstadisticas` debe calcular:
  - totalVentas (suma precio)
  - totalCobrado (suma precioAbonado)
  - totalPendiente (diferencia)
  - cantidadPagos, cantidadImpagos

---

### 5. Controladores Actualizados (Prioridad 3)

**ClienteController (`cliente.controller.ts`):**
```typescript
@ApiTags('Clientes')
@Controller('clientes')  // ⚠️ CAMBIAR DE 'cliente' a 'clientes'
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ClienteController {
  @Get()
  @ApiOperation({ summary: 'Obtener lista de clientes' })
  async findAll() { ... }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  async findOne(@Param('id') id: string) { ... }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo cliente' })
  async create(@Body() createDto: CreateClienteDto) { ... }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateClienteDto) { ... }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cliente (soft delete)' })
  async remove(@Param('id') id: string) { ... }
}
```

**PedidosController (`pedidos.controller.ts`):**
```typescript
@ApiTags('Pedidos')
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PedidosController {
  @Post()
  @ApiOperation({ summary: 'Crear nuevo pedido' })
  async create(@Body() createDto: CreatePedidoDto, @Request() req) {
    const pedido = await this.pedidosService.create(createDto, req.user.id);
    return { success: true, data: pedido };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de pedidos con filtros' })
  async findAll(@Query() filtros: FiltrosPedidosDto) {
    const pedidos = await this.pedidosService.findAll(filtros);
    return { success: true, data: pedidos };
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de pedidos' })
  async getEstadisticas(@Query() filtros: FiltrosPedidosDto) { ... }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar estado de pago' })
  async updateEstado(@Param('id') id: string, @Body() updateDto: UpdateEstadoPedidoDto) { ... }

  @Delete(':id')
  async remove(@Param('id') id: string) { ... }
}
```

---

### 6. Seed de Datos Iniciales (Prioridad 3)

**Ubicación:** `src/database/seeds/initial-seed.ts`

**Crear:**
```typescript
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { Cliente } from '../../modules/cliente/entities/cliente.entity';

export async function seedDatabase(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const clienteRepo = dataSource.getRepository(Cliente);

  // 1. Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await userRepo.save({
    usuario: 'admin',
    password: hashedPassword,
    nombre: 'Administrador',
    email: 'admin@laluna.com',
    rol: 'admin',
  });

  console.log('✅ Usuario admin creado:', admin.usuario);

  // 2. Crear clientes de ejemplo
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

  console.log(`✅ ${clientes.length} clientes creados`);
}
```

**Script en package.json:**
```json
"scripts": {
  "seed": "ts-node -r tsconfig-paths/register src/database/seeds/initial-seed.ts"
}
```

---

## 🎯 Frontend: Endpoints Esperados

El frontend React+TypeScript está esperando estos endpoints exactos:

### Auth
```
POST /api/auth/login
GET  /api/auth/verify
```

### Clientes
```
GET    /api/clientes
GET    /api/clientes/:id
POST   /api/clientes
PATCH  /api/clientes/:id
DELETE /api/clientes/:id
```

### Pedidos
```
GET    /api/pedidos (con query params: ?clienteId=&estado=&fechaDesde=&fechaHasta=)
GET    /api/pedidos/:id
POST   /api/pedidos
PATCH  /api/pedidos/:id/estado
DELETE /api/pedidos/:id
GET    /api/pedidos/estadisticas (con filtros)
```

**Formato de respuesta esperado:**
```typescript
{
  success: boolean,
  data?: any,
  error?: string
}
```

---

## 🚀 Comandos para Ejecutar

### Desarrollo
```bash
cd "g:\Developer Projects 2025\BackOfficeSystem-Luna\back"
npm run start:dev
```

### Build Producción
```bash
npm run build
npm run start:prod
```

### Ver Swagger
```
http://localhost:3000/api/docs
```

### Probar con curl
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin123"}'

# Get Clientes (con token)
curl -X GET http://localhost:3000/api/clientes \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 📁 Estructura de Archivos Actual

```
back/
├── src/
│   ├── main.ts ✅
│   ├── app.module.ts ✅
│   ├── config/
│   │   └── typeorm.ts (no se usa, usar app.module.ts)
│   └── modules/
│       ├── users/
│       │   └── entities/
│       │       └── user.entity.ts ✅
│       ├── cliente/
│       │   ├── cliente.module.ts ⚠️ (existe pero incompleto)
│       │   ├── cliente.controller.ts ⚠️ (existe pero incompleto)
│       │   ├── cliente.service.ts ⚠️ (existe pero vacío)
│       │   ├── entities/
│       │   │   └── cliente.entity.ts ✅
│       │   └── dto/
│       │       ├── create-cliente.dto.ts ⚠️ (existe pero sin validaciones)
│       │       └── update-cliente.dto.ts ⚠️ (existe pero sin validaciones)
│       └── pedidos/
│           ├── pedidos.module.ts ⚠️ (existe pero incompleto)
│           ├── pedidos.controller.ts ⚠️ (existe pero incompleto)
│           ├── pedidos.service.ts ⚠️ (existe pero vacío)
│           ├── entities/
│           │   └── pedido.entity.ts ✅
│           └── dto/
│               ├── create-pedido.dto.ts ⚠️ (existe pero sin validaciones)
│               └── update-pedido.dto.ts ⚠️ (existe pero sin validaciones)
├── .env.development ✅
├── .env.example ✅
├── package.json ✅
└── tsconfig.json ✅
```

**⚠️ = Existe pero requiere refactorización completa**

---

## 🔥 INSTRUCCIONES PARA LA NUEVA CONVERSACIÓN

1. **Copia este archivo completo** y úsalo como prompt inicial

2. **Pega este prompt:**
   ```
   Leí el archivo CONTEXTO_BACKEND.md. Necesito continuar la implementación del backend NestJS.

   Estado actual: Entidades creadas, TypeORM funcionando, servidor levantando.

   Próximo paso: Implementar módulo Auth completo (JWT + Guards + UsersService).

   Prioridades:
   1. Auth Module (login + verify)
   2. UsersService (con bcrypt)
   3. DTOs con validaciones
   4. Servicios de Clientes y Pedidos
   5. Seed de datos

   Por favor, generá el código del módulo Auth completo siguiendo exactamente las especificaciones del CONTEXTO_BACKEND.md.
   ```

3. **El nuevo chat tiene acceso a:**
   - Todos los archivos de `back/src/`
   - Base de datos PostgreSQL ya creada
   - Servidor funcionando

4. **NO necesita hacer:**
   - Instalar dependencias (ya están)
   - Crear entidades (ya existen)
   - Configurar TypeORM (ya está)

---

## 💡 Tips para el Nuevo Chat

- **Usa generación de código en bloques**: Primero Auth, luego DTOs, luego Servicios
- **Prueba después de cada módulo**: `npm run start:dev` y verifica Swagger
- **Importa correctamente**: Las entidades están en rutas relativas `../../`
- **No uses synchronize en producción**: Crear migrations antes de deploy
- **Formato de respuesta del frontend**: Siempre `{ success, data?, error? }`

---

## 🎯 Objetivo Final

Backend completamente funcional con:
- ✅ Login con JWT
- ✅ CRUD Clientes con estadísticas automáticas
- ✅ CRUD Pedidos con filtros y estadísticas
- ✅ Swagger documentado
- ✅ Datos de seed para testing
- ✅ Listo para deploy (Render/Railway)

---

**Última actualización:** 27/11/2025 - 17:10
**Creado por:** Claude Code Session 1
**Continuar en:** Claude Code Session 2
