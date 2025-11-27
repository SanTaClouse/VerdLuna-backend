import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';
import { FiltrosPedidosDto } from './dto/filtros-pedidos.dto';
import { Pedido } from './entities/pedido.entity';
import { ClienteService } from '../cliente/cliente.service';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    private clienteService: ClienteService,
  ) {}

  async create(createPedidoDto: CreatePedidoDto, userId?: string): Promise<Pedido> {
    // Verificar que el cliente existe
    await this.clienteService.findOne(createPedidoDto.clienteId);

    const pedido = this.pedidoRepository.create({
      ...createPedidoDto,
      creadoPorId: userId,
    });

    const pedidoGuardado = await this.pedidoRepository.save(pedido);

    // Actualizar estadísticas del cliente
    await this.clienteService.actualizarEstadisticas(createPedidoDto.clienteId);

    return pedidoGuardado;
  }

  async findAll(filtros: FiltrosPedidosDto = {}): Promise<Pedido[]> {
    const query = this.pedidoRepository.createQueryBuilder('pedido');

    // Filtro por cliente
    if (filtros.clienteId) {
      query.andWhere('pedido.clienteId = :clienteId', { clienteId: filtros.clienteId });
    }

    // Filtro por estado
    if (filtros.estado && filtros.estado !== 'Todos') {
      query.andWhere('pedido.estado = :estado', { estado: filtros.estado });
    }

    // Filtro por rango de fechas
    if (filtros.fechaDesde && filtros.fechaHasta) {
      query.andWhere('pedido.fecha BETWEEN :fechaDesde AND :fechaHasta', {
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
      });
    } else if (filtros.fechaDesde) {
      query.andWhere('pedido.fecha >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
    } else if (filtros.fechaHasta) {
      query.andWhere('pedido.fecha <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
    }

    return query.orderBy('pedido.fecha', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return pedido;
  }

  async updateEstado(id: string, updateEstadoDto: UpdateEstadoPedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);

    pedido.precioAbonado = updateEstadoDto.precioAbonado;

    const pedidoActualizado = await this.pedidoRepository.save(pedido);

    // Actualizar estadísticas del cliente
    await this.clienteService.actualizarEstadisticas(pedido.clienteId);

    return pedidoActualizado;
  }

  async remove(id: string): Promise<void> {
    const pedido = await this.findOne(id);

    const clienteId = pedido.clienteId;

    await this.pedidoRepository.remove(pedido);

    // Actualizar estadísticas del cliente
    await this.clienteService.actualizarEstadisticas(clienteId);
  }

  async getEstadisticas(filtros: FiltrosPedidosDto = {}): Promise<any> {
    const pedidos = await this.findAll(filtros);

    const totalVentas = pedidos.reduce((sum, p) => sum + Number(p.precio), 0);
    const totalCobrado = pedidos.reduce((sum, p) => sum + Number(p.precioAbonado), 0);
    const totalPendiente = totalVentas - totalCobrado;

    const cantidadPagos = pedidos.filter(p => p.estado === 'Pago').length;
    const cantidadImpagos = pedidos.filter(p => p.estado === 'Impago').length;

    return {
      totalVentas,
      totalCobrado,
      totalPendiente,
      cantidadPagos,
      cantidadImpagos,
      cantidadTotal: pedidos.length,
    };
  }
}
