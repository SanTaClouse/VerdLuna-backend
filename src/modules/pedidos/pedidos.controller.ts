import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';
import { FiltrosPedidosDto } from './dto/filtros-pedidos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Pedidos')
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo pedido' })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async create(@Body() createPedidoDto: CreatePedidoDto, @Request() req) {
    const pedido = await this.pedidosService.create(createPedidoDto, req.user.id);
    return { success: true, data: pedido };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de pedidos con filtros opcionales' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@Query() filtros: FiltrosPedidosDto) {
    const pedidos = await this.pedidosService.findAll(filtros);
    return { success: true, data: pedidos };
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
