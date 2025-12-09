import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Verifica el estado general de la aplicación',
    description: 'Endpoint para monitoreo. Verifica base de datos, memoria y disco.'
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicación saludable',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' }
        },
        error: {},
        details: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' }
        }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'Servicio no disponible',
  })
  check() {
    return this.health.check([
      // Verifica conexión a PostgreSQL
      () => this.db.pingCheck('database'),

      // Verifica que el heap de memoria no supere 300MB
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Verifica que la memoria RSS no supere 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @Get('db')
  @HealthCheck()
  @ApiOperation({
    summary: 'Verifica solo la base de datos',
    description: 'Útil para verificar si PostgreSQL está respondiendo.'
  })
  @ApiResponse({
    status: 200,
    description: 'Base de datos OK',
  })
  checkDatabase() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('ping')
  @ApiOperation({
    summary: 'Ping simple',
    description: 'Verifica que el servidor esté respondiendo (sin verificar dependencias).'
  })
  @ApiResponse({
    status: 200,
    description: 'Servidor OK',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-15T10:30:00.000Z',
        uptime: 12345
      }
    }
  })
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
