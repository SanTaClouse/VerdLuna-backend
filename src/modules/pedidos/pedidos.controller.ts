import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { CreatePedidoResponseDto } from './dto/create-pedido-response.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';
import { UpdatePrecioAbonadoDto } from './dto/update-precio-abonado.dto';
import { FiltrosPedidosDto } from './dto/filtros-pedidos.dto';
import { JwtAuthGuard } from '../auth/strategies/guards/jwt-auth.guard';
import { ReportesQueryDto } from './dto/reportes-query.dto';

@ApiTags('Pedidos')
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) { }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo pedido' })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente con link de WhatsApp', type: CreatePedidoResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async create(@Body() createPedidoDto: CreatePedidoDto, @Request() req) {
    const result = await this.pedidosService.create(createPedidoDto, req.user.id);
    return {
      success: true,
      data: {
        pedido: result.pedido,
        whatsappLink: result.whatsappLink,
      }
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de pedidos con filtros y paginación opcionales' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos paginada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@Query() filtros: FiltrosPedidosDto) {
    const result = await this.pedidosService.findAll(filtros);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Get('reportes')
  @ApiOperation({ summary: 'Obtener reporte completo: estadísticas generales, desglose mensual y top clientes' })
  @ApiResponse({ status: 200, description: 'Reporte completo generado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getReportes(@Query() query: ReportesQueryDto) {
    const data = await this.pedidosService.getReportes(query.meses ?? 6);
    return { success: true, data };
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de pedidos' })
  @ApiResponse({ status: 200, description: 'Estadísticas calculadas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getEstadisticas(@Query() filtros: FiltrosPedidosDto) {
    const estadisticas = await this.pedidosService.getEstadisticas(filtros);
    return { success: true, data: estadisticas };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findOne(@Param('id') id: string) {
    const pedido = await this.pedidosService.findOne(id);
    return { success: true, data: pedido };
  }

  @Get(':id/whatsapp-link')
  @ApiOperation({ summary: 'Generar link de WhatsApp para un pedido existente' })
  @ApiResponse({ status: 200, description: 'Link generado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getWhatsappLink(@Param('id') id: string) {
    const link = await this.pedidosService.getWhatsappLink(id);
    return { success: true, data: { whatsappLink: link } };
  }

  @Patch(':id/whatsapp-enviado')
  @ApiOperation({ summary: 'Marcar link de WhatsApp como enviado' })
  @ApiResponse({ status: 200, description: 'WhatsApp marcado como enviado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async marcarWhatsappEnviado(@Param('id') id: string) {
    const pedido = await this.pedidosService.marcarWhatsappEnviado(id);
    return { success: true, data: pedido };
  }

  @Patch(':id/marcar-pago')
  @ApiOperation({ summary: 'Marcar pedido como pago completo' })
  @ApiResponse({ status: 200, description: 'Pedido marcado como pago' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async marcarComoPago(@Param('id') id: string) {
    const pedido = await this.pedidosService.marcarComoPago(id);
    return { success: true, data: pedido };
  }

  @Patch(':id/precio-abonado')
  @ApiOperation({ summary: 'Actualizar precio abonado (pago parcial)' })
  @ApiResponse({ status: 200, description: 'Precio abonado actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async actualizarPrecioAbonado(@Param('id') id: string, @Body() updatePrecioAbonadoDto: UpdatePrecioAbonadoDto) {
    const pedido = await this.pedidosService.actualizarPrecioAbonado(id, updatePrecioAbonadoDto.monto);
    return { success: true, data: pedido };
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar monto abonado y estado de pago' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateEstado(@Param('id') id: string, @Body() updateEstadoDto: UpdateEstadoPedidoDto) {
    const pedido = await this.pedidosService.updateEstado(id, updateEstadoDto);
    return { success: true, data: pedido };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar pedido' })
  @ApiResponse({ status: 200, description: 'Pedido eliminado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async remove(@Param('id') id: string) {
    await this.pedidosService.remove(id);
    return { success: true, message: 'Pedido eliminado correctamente' };
  }
}
