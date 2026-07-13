import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FacturacionService } from './facturacion.service';
import { JwtAuthGuard } from '../auth/strategies/guards/jwt-auth.guard';

@ApiTags('Facturación')
@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  @Get('estado')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Estado de facturación: aviso / bloqueo / monto adeudado' })
  async getEstado() {
    const data = await this.facturacionService.getEstado();
    return { data };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Historial de facturas del hosting' })
  async getHistorial() {
    const data = await this.facturacionService.getHistorial();
    return { data };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getById(@Param('id') id: string) {
    const data = await this.facturacionService.getById(id);
    return { data };
  }

  @Post(':id/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear preferencia de pago en Mercado Pago (Checkout Pro)' })
  async crearCheckout(@Param('id') id: string) {
    const data = await this.facturacionService.crearCheckout(id);
    return { data };
  }

  @Post(':id/marcar-pago')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Marcar una factura como pagada manualmente (fallback)' })
  async marcarPago(@Param('id') id: string) {
    const data = await this.facturacionService.marcarPagoManual(id);
    return { data };
  }

  // Lo llama Mercado Pago → sin guard. Responder 200 siempre que se procese.
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook de notificaciones de pago de Mercado Pago' })
  async webhook(@Query() query: any, @Body() body: any, @Req() req: any) {
    return this.facturacionService.procesarWebhook(query, body, req.headers);
  }

  // Endpoint one-time para sembrar el historial (igual patrón que mercadería).
  @Post('seed')
  @ApiOperation({ summary: 'Sembrar historial de facturas (Dic-2025 → Jul-2026)' })
  async seed() {
    const data = await this.facturacionService.seed();
    return { data };
  }
}
