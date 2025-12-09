# 🏥 Health Checks - Guía de Uso

## ¿Qué son los Health Checks?

Los health checks son endpoints especiales que verifican si tu aplicación y sus dependencias están funcionando correctamente. Son esenciales para:

- ✅ **Monitoreo automático**: Render, Heroku, etc. pueden verificar si tu app está viva
- ✅ **Alertas tempranas**: Detectar problemas antes que los usuarios los reporten
- ✅ **Debugging**: Saber exactamente qué componente está fallando
- ✅ **Load balancers**: Saben si deben enviar tráfico a tu servidor

---

## 📍 Endpoints Disponibles

### 1. **GET /api/health** - Verificación Completa

Verifica **TODOS** los componentes del sistema:
- ✅ Conexión a PostgreSQL
- ✅ Memoria heap (no supera 300MB)
- ✅ Memoria RSS (no supera 300MB)
- ✅ Espacio en disco (< 90% usado)

**Ejemplo de respuesta exitosa:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "storage": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "storage": { "status": "up" }
  }
}
```

**Ejemplo de respuesta con error (status 503):**
```json
{
  "status": "error",
  "info": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  },
  "error": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  },
  "details": { ... }
}
```

---

### 2. **GET /api/health/db** - Solo Base de Datos

Verifica únicamente la conexión a PostgreSQL.

**Uso típico:**
```bash
curl https://tu-app.onrender.com/api/health/db
```

---

### 3. **GET /api/health/ping** - Ping Simple

Verifica que el servidor esté respondiendo (NO verifica dependencias).

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345
}
```

**Uso típico:**
- Verificación rápida sin carga en la base de datos
- Uptime monitors externos

---

## 🔧 Configuración en Render

### Opción 1: Health Check Path (Recomendado)

En el dashboard de Render:

1. Ve a tu servicio
2. Settings → Health Check Path
3. Ingresa: `/api/health/ping`
4. Save

**Render verificará automáticamente cada 30 segundos:**
- ✅ Status 200 = Aplicación saludable
- ❌ Timeout o error = Reinicia el contenedor

---

### Opción 2: Monitoreo Externo con UptimeRobot

1. Crea cuenta en [UptimeRobot](https://uptimerobot.com/) (gratis)
2. Agrega monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://tu-app.onrender.com/api/health`
   - Monitoring Interval: 5 minutos
   - Alert Contacts: Tu email

3. **Recibe alertas cuando:**
   - Base de datos está caída
   - Memoria > 300MB
   - Disco > 90%

---

## 📊 Integración con Render Logs

### Ver logs de health checks:

```bash
# En tu terminal local
render logs --tail

# O en el dashboard de Render
# Logs → View logs
```

**Ejemplo de logs:**
```
[2024-01-15 10:30:00] GET /api/health 200 - 45ms
[2024-01-15 10:30:30] GET /api/health 200 - 42ms
[2024-01-15 10:31:00] GET /api/health 503 - 5002ms  ⚠️ DATABASE DOWN
```

---

## 🔔 Configurar Alertas en Render

Render no tiene alertas nativas, pero puedes usar:

### Opción A: Better Stack (ex-Logtail)

1. Crea cuenta en [Better Stack](https://betterstack.com/)
2. Copia tu Source Token
3. En Render, agrega variable de entorno:
   ```
   LOGTAIL_TOKEN=tu_token_aqui
   ```
4. Instala en tu app:
   ```bash
   npm install @logtail/node
   ```

### Opción B: Healthchecks.io

1. Crea cuenta en [Healthchecks.io](https://healthchecks.io/)
2. Crea un check con UUID único
3. Configura un cron job en Render que llame a tu health check:

```yaml
# En render.yaml
services:
  - type: web
    name: backoffice-luna-api
    env: node
    healthCheckPath: /api/health/ping

  - type: cron
    name: health-monitor
    schedule: "*/5 * * * *"  # Cada 5 minutos
    command: "curl https://tu-app.onrender.com/api/health && curl https://hc-ping.com/tu-uuid"
```

---

## 🚀 Pruebas Locales

### 1. Levantar el servidor
```bash
cd back
npm run start:dev
```

### 2. Probar endpoints

**Verificación completa:**
```bash
curl http://localhost:3000/api/health
```

**Solo database:**
```bash
curl http://localhost:3000/api/health/db
```

**Ping simple:**
```bash
curl http://localhost:3000/api/health/ping
```

### 3. Simular fallo de base de datos

```bash
# Detener PostgreSQL
sudo service postgresql stop

# Llamar al health check
curl http://localhost:3000/api/health
# Debería retornar 503 Service Unavailable

# Reiniciar PostgreSQL
sudo service postgresql start
```

---

## 📈 Métricas Monitoreadas

| Métrica | Límite | Acción si excede |
|---------|--------|------------------|
| **Database Ping** | 5 segundos | Status: down |
| **Memory Heap** | 300 MB | Status: down |
| **Memory RSS** | 300 MB | Status: down |
| **Disk Usage** | 90% | Status: down |

---

## 🛠️ Personalización

### Ajustar límites de memoria

Edita [health.controller.ts](src/health/health.controller.ts):

```typescript
// Cambiar de 300MB a 500MB
() => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
```

### Agregar verificación de Redis (futuro)

```typescript
import { RedisHealthIndicator } from '@nestjs/terminus';

constructor(
  private redis: RedisHealthIndicator,
) {}

check() {
  return this.health.check([
    () => this.redis.checkHealth('redis'),
  ]);
}
```

---

## 📚 Referencias

- [NestJS Terminus Docs](https://docs.nestjs.com/recipes/terminus)
- [Render Health Checks](https://render.com/docs/health-checks)
- [HTTP Status Codes](https://httpstatuses.com/)

---

## ❓ FAQ

**Q: ¿Necesito autenticación para estos endpoints?**
A: NO. Los health checks deben ser públicos para que Render y otros servicios puedan verificarlos.

**Q: ¿Puedo usar /api/health en producción?**
A: SÍ. Es un patrón estándar de la industria.

**Q: ¿Con qué frecuencia debería verificar?**
A:
- **Producción crítica**: Cada 30-60 segundos
- **Aplicaciones normales**: Cada 5 minutos
- **Desarrollo**: Cada 30 minutos o bajo demanda

**Q: ¿Qué pasa si el health check falla?**
A: Render reiniciará automáticamente el contenedor después de varios fallos consecutivos.

**Q: ¿Afecta el rendimiento?**
A: NO. Los health checks son operaciones muy ligeras (<50ms típicamente).
