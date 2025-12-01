import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';
import { FiltrosPedidosDto } from './dto/filtros-pedidos.dto';
import { Pedido } from './entities/pedido.entity';
import { ClienteService } from '../cliente/cliente.service';
import { Cliente } from '../cliente/entities/cliente.entity';


@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    private clienteService: ClienteService,
  ) { }

  async create(createPedidoDto: CreatePedidoDto, userId?: string): Promise<{ pedido: Pedido; whatsappLink: string }> {
    // Verificar que el cliente existe
    const cliente = await this.clienteService.findOne(createPedidoDto.clienteId);

    const pedido = this.pedidoRepository.create({
      ...createPedidoDto,
      creadoPorId: userId,
    });

    const pedidoGuardado = await this.pedidoRepository.save(pedido);

    // Actualizar estadísticas del cliente
    await this.clienteService.actualizarEstadisticas(createPedidoDto.clienteId);

    // Cargar el pedido con TODAS las relaciones necesarias
    const pedidoCompleto = await this.pedidoRepository.findOne({
      where: { id: pedidoGuardado.id },
      relations: ['cliente', 'creadoPor'],
    });

    if (!pedidoCompleto) {
      throw new NotFoundException('Error al cargar el pedido creado');
    }

    // Generar link de WhatsApp
    const whatsappLink = this.createWspOrder(pedidoCompleto, cliente);

    return {
      pedido: pedidoCompleto,
      whatsappLink,
    };
  }

  createWspOrder(pedido: Pedido, cliente: Cliente): string {
    // Limpiar el número de teléfono: remover espacios, guiones, paréntesis
    let telefono = cliente.telefono.replace(/[\s\-\(\)\+]/g, '');

    // Si no empieza con 549 (Argentina), agregarlo
    if (!telefono.startsWith('549')) {
      // Si empieza con 54, agregar el 9
      if (telefono.startsWith('54')) {
        telefono = '549' + telefono.substring(2);
      }
      // Si empieza con 0, quitar el 0 y agregar 549
      else if (telefono.startsWith('0')) {
        telefono = '549' + telefono.substring(1);
      }
      // Si no tiene código de país, agregar 549
      else {
        telefono = '549' + telefono;
      }
    }

    // Limitar la descripción a 200 caracteres para evitar URLs muy largas
    const descripcionCorta = pedido.descripcion.length > 200
      ? pedido.descripcion.substring(0, 200) + '...'
      : pedido.descripcion;

    const message = `Hola ${cliente.nombre}!
Tu pedido N° ${pedido.id} fue registrado.

Detalles: ${descripcionCorta}
Total: $${pedido.precio}

Verdulería La Luna`;

    // Usar encodeURIComponent en lugar de querystring.escape para mejor compatibilidad móvil
    const encoded = encodeURIComponent(message);

    const link = `https://wa.me/${telefono}?text=${encoded}`;

    return link;
  }


  async findAll(filtros: FiltrosPedidosDto = {}): Promise<Pedido[]> {
    const query = this.pedidoRepository.createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.cliente', 'cliente')
      .leftJoinAndSelect('pedido.creadoPor', 'creadoPor');

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
      relations: ['cliente', 'creadoPor'],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return pedido;
  }

  async marcarComoPago(id: string): Promise<Pedido> {
    const pedido = await this.findOne(id);

    // Marcar como pago completo
    pedido.precioAbonado = pedido.precio;
    // El estado se actualiza automáticamente por el hook @BeforeUpdate

    const pedidoActualizado = await this.pedidoRepository.save(pedido);

    // Actualizar estadísticas del cliente
    await this.clienteService.actualizarEstadisticas(pedido.clienteId);

    return pedidoActualizado;
  }

  async getWhatsappLink(id: string): Promise<string> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
      relations: ['cliente'],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return this.createWspOrder(pedido, pedido.cliente);
  }

  async marcarWhatsappEnviado(id: string): Promise<Pedido> {
    const pedido = await this.findOne(id);
    pedido.whatsappEnviado = true;
    return await this.pedidoRepository.save(pedido);
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
