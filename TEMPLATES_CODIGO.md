# Templates de Código - BackOffice System Luna

Este archivo contiene **código listo para copiar/pegar** o usar como referencia en la implementación.

---

## 1. Auth Module - JWT Strategy

**Archivo:** `src/modules/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    return {
      id: user.id,
      usuario: user.usuario,
      rol: user.rol,
    };
  }
}
```

---

## 2. Auth Module - JWT Guard

**Archivo:** `src/modules/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

---

## 3. Auth Service

**Archivo:** `src/modules/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { usuario, password } = loginDto;

    // Buscar usuario
    const user = await this.usersService.findByUsuario(usuario);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar JWT
    const payload = {
      sub: user.id,
      usuario: user.usuario,
      rol: user.rol,
    };

    const token = this.jwtService.sign(payload);

    // Eliminar password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token,
    };
  }

  async verify(userId: string) {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
    };
  }
}
```

---

## 4. Auth Controller

**Archivo:** `src/modules/auth/auth.controller.ts`

```typescript
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        success: true,
        user: {
          id: 'uuid',
          usuario: 'admin',
          nombre: 'Administrador',
          rol: 'admin',
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verificar token JWT' })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
    schema: {
      example: {
        success: true,
        user: {
          id: 'uuid',
          usuario: 'admin',
          nombre: 'Administrador',
          rol: 'admin',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  async verify(@Request() req) {
    return this.authService.verify(req.user.id);
  }
}
```

---

## 5. Auth Module

**Archivo:** `src/modules/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 6. Users Service

**Archivo:** `src/modules/users/users.service.ts`

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el usuario ya existe
    const existingUser = await this.usersRepository.findOne({
      where: { usuario: createUserDto.usuario },
    });

    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByUsuario(usuario: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { usuario } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { activo: true },
      select: ['id', 'usuario', 'nombre', 'email', 'rol', 'createdAt'],
    });
  }
}
```

---

## 7. Users Module

**Archivo:** `src/modules/users/users.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## 8. DTOs con Validaciones

### Login DTO

**Archivo:** `src/modules/auth/dto/login.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'admin',
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'El usuario es requerido' })
  @IsString({ message: 'El usuario debe ser un texto' })
  @Length(3, 50, { message: 'El usuario debe tener entre 3 y 50 caracteres' })
  usuario: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'admin123',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
```

### Create User DTO

**Archivo:** `src/modules/users/dto/create-user.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
  IsEmail,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  usuario: string;

  @ApiProperty({ example: 'admin123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Administrador', required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ example: 'admin@laluna.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.VENDEDOR })
  @IsOptional()
  @IsEnum(UserRole)
  rol?: UserRole;
}
```

### Create Cliente DTO

**Archivo:** `src/modules/cliente/dto/create-cliente.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  IsEmail,
  IsOptional,
} from 'class-validator';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Nombre o razón social del cliente',
    example: 'Verdulería El Sol',
  })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @Length(2, 150)
  nombre: string;

  @ApiProperty({
    description: 'Dirección completa',
    example: 'San Martín 456, Maciel',
  })
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @IsString()
  direccion: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '3434569846',
  })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @Matches(/^[0-9\s\-\+\(\)]+$/, {
    message: 'El teléfono solo puede contener números y símbolos válidos',
  })
  telefono: string;

  @ApiProperty({
    description: 'Email del cliente',
    example: 'cliente@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({
    description: 'Notas o descripción del cliente',
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
```

### Create Pedido DTO

**Archivo:** `src/modules/pedidos/dto/create-pedido.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsNumber,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreatePedidoDto {
  @ApiProperty({
    description: 'ID del cliente',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  clienteId: string;

  @ApiProperty({
    description: 'Descripción detallada del pedido',
    example: '10 kg de papa, 5 kg de cebolla, 3 kg de zanahoria',
  })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @IsString()
  descripcion: string;

  @ApiProperty({
    description: 'Precio total del pedido',
    example: 15000.50,
  })
  @IsNotEmpty({ message: 'El precio es requerido' })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  precio: number;

  @ApiProperty({
    description: 'Monto abonado',
    example: 5000,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El precio abonado debe ser un número' })
  @Min(0, { message: 'El precio abonado debe ser mayor o igual a 0' })
  precioAbonado?: number;

  @ApiProperty({
    description: 'Fecha del pedido (YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  fecha: string;
}
```

---

## 9. Actualizar app.module.ts

**Agregar al final de imports:**

```typescript
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // ... imports existentes
    AuthModule,
    UsersModule,
  ],
  // ...
})
```

---

## 10. Script para Crear Seed

**Archivo:** `src/database/seeds/seed.ts`

```typescript
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
```

**Agregar script en package.json:**

```json
"scripts": {
  "seed": "ts-node -r tsconfig-paths/register src/database/seeds/seed.ts"
}
```

---

## 11. Comandos de Ejecución

```bash
# Instalar dependencias (si falta algo)
npm install

# Ejecutar seed
npm run seed

# Iniciar servidor desarrollo
npm run start:dev

# Ver Swagger
# http://localhost:3000/api/docs

# Probar login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin123"}'

# Guardar token y probar endpoint protegido
curl -X GET http://localhost:3000/api/clientes \
  -H "Authorization: Bearer <TOKEN_AQUI>"
```

---

## 12. Checklist de Implementación

### Paso 1: Auth Module
- [ ] Crear carpeta `src/modules/auth/`
- [ ] Crear `strategies/jwt.strategy.ts`
- [ ] Crear `guards/jwt-auth.guard.ts`
- [ ] Crear `dto/login.dto.ts`
- [ ] Crear `auth.service.ts`
- [ ] Crear `auth.controller.ts`
- [ ] Crear `auth.module.ts`

### Paso 2: Users Module
- [ ] Crear carpeta `src/modules/users/`
- [ ] Crear `dto/create-user.dto.ts`
- [ ] Crear `users.service.ts`
- [ ] Crear `users.module.ts`
- [ ] Actualizar `app.module.ts` (importar AuthModule y UsersModule)

### Paso 3: Clientes DTOs
- [ ] Actualizar `cliente/dto/create-cliente.dto.ts` con validaciones
- [ ] Crear `cliente/dto/update-cliente.dto.ts`

### Paso 4: Pedidos DTOs
- [ ] Actualizar `pedidos/dto/create-pedido.dto.ts` con validaciones
- [ ] Crear `pedidos/dto/update-pedido.dto.ts`
- [ ] Crear `pedidos/dto/filtros-pedidos.dto.ts`
- [ ] Crear `pedidos/dto/update-estado-pedido.dto.ts`

### Paso 5: Servicios
- [ ] Implementar `cliente/cliente.service.ts`
- [ ] Implementar `pedidos/pedidos.service.ts`

### Paso 6: Controladores
- [ ] Actualizar `cliente/cliente.controller.ts` con guards y swagger
- [ ] Actualizar `pedidos/pedidos.controller.ts` con guards y swagger

### Paso 7: Seed
- [ ] Crear `database/seeds/seed.ts`
- [ ] Ejecutar `npm run seed`

### Paso 8: Testing
- [ ] Probar `/api/auth/login`
- [ ] Probar `/api/auth/verify`
- [ ] Probar `/api/clientes` (CRUD)
- [ ] Probar `/api/pedidos` (CRUD)
- [ ] Verificar Swagger en `/api/docs`

---

**Éxito! 🚀**
