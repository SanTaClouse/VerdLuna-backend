# 🚀 Prompt Inicial para Nueva Conversación

**Copia y pega esto en la nueva conversación de Claude Code:**

---

Hola! Necesito continuar la implementación del backend NestJS para "BackOffice System Luna".

**Estado actual:**
- ✅ Entidades TypeORM creadas (User, Cliente, Pedido)
- ✅ Base de datos PostgreSQL conectada y tablas creadas
- ✅ Servidor funcional con Swagger en `http://localhost:3000/api/docs`
- ✅ CORS configurado para frontend React
- ✅ ValidationPipe global activado

**Archivos de contexto disponibles:**
1. `CONTEXTO_BACKEND.md` - Documentación completa del estado actual
2. `TEMPLATES_CODIGO.md` - Templates listos para implementar

**Próximo paso inmediato:**
Implementar el módulo de **Autenticación (Auth)** con JWT que incluye:
- JwtStrategy
- JwtAuthGuard
- AuthService con login() y verify()
- AuthController con endpoints POST /login y GET /verify
- UsersService con bcrypt para hash de passwords
- DTOs con validaciones (LoginDto, CreateUserDto)

**Frontend esperando:**
- `POST /api/auth/login` → `{ usuario, password }` → `{ success, user, token }`
- `GET /api/auth/verify` → Header con Bearer token → `{ success, user }`

**Credenciales por defecto del seed:**
- Usuario: `admin`
- Password: `admin123`

**Instrucción:**
Por favor, lee el archivo `CONTEXTO_BACKEND.md` y luego implementa el módulo Auth completo siguiendo los templates de `TEMPLATES_CODIGO.md`.

Genera el código de los siguientes archivos en este orden:
1. `src/modules/auth/strategies/jwt.strategy.ts`
2. `src/modules/auth/guards/jwt-auth.guard.ts`
3. `src/modules/auth/dto/login.dto.ts`
4. `src/modules/users/dto/create-user.dto.ts`
5. `src/modules/users/users.service.ts`
6. `src/modules/users/users.module.ts`
7. `src/modules/auth/auth.service.ts`
8. `src/modules/auth/auth.controller.ts`
9. `src/modules/auth/auth.module.ts`
10. Actualizar `src/app.module.ts` (importar AuthModule y UsersModule)

Después de generar cada archivo, espera mi confirmación antes de continuar con el siguiente.

---

**¿Listo para empezar?** 🚀
