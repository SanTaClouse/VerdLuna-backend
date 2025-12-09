# 🔧 Configuración de Render - BackOffice Luna

## ⚠️ PROBLEMA IDENTIFICADO

**Error actual:**
```
Timed out after waiting for internal health check to return a successful response code at:
verdluna-backend.onrender.com:3000/api/health/ping
```

**Causa:** Render está intentando acceder al puerto 3000 externamente, pero el puerto 3000 es INTERNO a tu contenedor.

---

## ✅ SOLUCIÓN: Configurar Health Check Correctamente

### Opción 1: Health Check Path (Recomendado)

1. Ve a tu servicio en Render Dashboard
2. **Settings** → **Health & Alerts**
3. **Health Check Path**: `/api/health/ping`
4. **NO incluir** el dominio ni el puerto, solo el path
5. **Save Changes**

**IMPORTANTE:**
- ✅ Correcto: `/api/health/ping`
- ❌ Incorrecto: `verdluna-backend.onrender.com:3000/api/health/ping`
- ❌ Incorrecto: `http://verdluna-backend.onrender.com/api/health/ping`

### Cómo funciona:

- Render usa el **puerto interno** automáticamente (variable `PORT`)
- Tu app escucha en `process.env.PORT || 3000`
- Render expone tu app externamente en puerto 80/443
- El health check llama INTERNAMENTE a `http://localhost:${PORT}/api/health/ping`

---

## 🔍 Verificar que Funciona

### 1. Verificar localmente:

```bash
# Simular lo que hace Render
curl http://localhost:3000/api/health/ping

# Deberías ver:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345
}
```

### 2. Verificar en producción (después de configurar):

```bash
curl https://verdluna-backend.onrender.com/api/health/ping

# Deberías ver lo mismo
```

---

## 📋 Configuración Completa de Render

### Environment Variables (obligatorias):

```bash
# Base de datos
DATABASE_HOST=dpg-xxxxx.oregon-postgres.render.com
DATABASE_PORT=5432
DATABASE_USER=tu_usuario
DATABASE_PASS=tu_password_seguro
DATABASE_NAME=tu_base_de_datos

# JWT
JWT_SECRET=un_secret_muy_seguro_minimo_32_caracteres

# Frontend URL (para CORS)
FRONTEND_URL=https://verdluna.onrender.com

# Node environment
NODE_ENV=production
```

### Build Command:

```bash
npm install && npm run build:prod
```

### Start Command:

```bash
npm run start:prod
```

### Health Check Settings:

- **Health Check Path:** `/api/health/ping`
- **Health Check Interval:** 30 seconds (default)
- **Health Check Timeout:** 30 seconds (default)

---

## 🚨 Troubleshooting

### Si el health check sigue fallando:

#### 1. Verificar logs de Render:

```bash
# En el dashboard de Render:
Logs → View logs
```

Busca líneas como:
```
✅ Servidor corriendo
🚀 ===================================
```

#### 2. Verificar que el puerto es correcto:

Tu `main.ts` debería tener:
```typescript
const port = process.env.PORT || 3000;
await app.listen(port);
```

#### 3. Probar el endpoint manualmente:

```bash
# Desde tu navegador o terminal:
curl -v https://verdluna-backend.onrender.com/api/health/ping
```

Si obtienes respuesta 200 OK → El endpoint funciona, el problema es la configuración de Render

Si obtienes error → Revisar logs de la aplicación

#### 4. Verificar CORS:

El health check NO necesita CORS (es interno), pero para verificar desde el navegador:

```typescript
// En main.ts, verificar que tienes:
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

---

## 🔄 Alternativa: Sin Health Check

Si sigues teniendo problemas, puedes **DESACTIVAR temporalmente** el health check:

1. Render Dashboard → Settings
2. **Health Check Path**: Dejar vacío
3. Save

**NOTA:** No recomendado a largo plazo, pero útil para debuggear.

---

## 📊 Endpoints de Health Check Disponibles

Una vez configurado, tendrás:

| Endpoint | Uso | Verifica |
|----------|-----|----------|
| `/api/health/ping` | **Render** (recomendado) | Solo que el servidor responde |
| `/api/health/db` | Debugging | Solo base de datos |
| `/api/health` | Monitoreo completo | DB + Memoria |

---

## 🎯 Configuración Recomendada Final

### En Render:

```
Health Check Path: /api/health/ping
Health Check Interval: 30
Health Check Timeout: 30
```

### Monitoreo Externo (Opcional):

Configura **UptimeRobot** para llamar a:
```
https://verdluna-backend.onrender.com/api/health
```

Esto te da:
- ✅ Alertas por email si la app cae
- ✅ Estadísticas de uptime
- ✅ Gratis hasta 50 monitores

---

## ✅ Checklist de Deploy

- [ ] Variables de entorno configuradas en Render
- [ ] Health Check Path = `/api/health/ping` (sin dominio, sin puerto)
- [ ] Build command = `npm install && npm run build:prod`
- [ ] Start command = `npm run start:prod`
- [ ] Deploy exitoso (logs muestran "Servidor corriendo")
- [ ] Health check responde 200 OK
- [ ] Frontend puede conectarse al backend

---

## 🆘 Soporte

Si el problema persiste después de seguir esta guía:

1. Verificar logs de Render
2. Probar endpoints manualmente con curl
3. Verificar que todas las variables de entorno están configuradas
4. Revisar que el puerto se lee de `process.env.PORT`

**Logs útiles:**
```bash
# En main.ts, agregar temporalmente:
console.log('🔍 Puerto configurado:', port);
console.log('🔍 Variables de entorno:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
});
```
