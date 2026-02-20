import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    // Formatear precio con separadores de miles
    const precioFormateado = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(pedido.precio);

    const message = `*VERDULERIA LA LUNA*

Hola *${cliente.nombre}*!

Tu pedido fue registrado exitosamente.

*PEDIDO N°:* ${pedido.id}

*DETALLE DEL PEDIDO:*
${pedido.descripcion}

*TOTAL: ${precioFormateado}*

${cliente.direccion ? `*DIRECCION DE ENTREGA:*\n${cliente.direccion}\n\n` : ''}Muchas gracias por tu compra!

_Verduleria La Luna_
Web: https://laluna123.vercel.app/`;

    // Usar encodeURIComponent en lugar de querystring.escape para mejor compatibilidad móvil
    const encoded = encodeURIComponent(message);

    const link = `https://wa.me/${telefono}?text=${encoded}`;

    return link;
  }


  private buildBaseQuery(filtros: FiltrosPedidosDto) {
    const query = this.pedidoRepository.createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.cliente', 'cliente')
      .leftJoinAndSelect('pedido.creadoPor', 'creadoPor');

    if (filtros.clienteId) {
      query.andWhere('pedido.clienteId = :clienteId', { clienteId: filtros.clienteId });
    }

    if (filtros.estado && filtros.estado !== 'Todos') {
      query.andWhere('pedido.estado = :estado', { estado: filtros.estado });
    }

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

    return query;
  }

  async findAll(filtros: FiltrosPedidosDto = {}): Promise<{ data: Pedido[]; total: number; page: number; totalPages: number }> {
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 20;

    const [data, total] = await this.buildBaseQuery(filtros)
      .orderBy('pedido.fecha', 'DESC')
      .addOrderBy('pedido.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
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

  async actualizarPrecioAbonado(id: string, monto: number): Promise<Pedido> {
    const pedido = await this.findOne(id);

    // Sumar el nuevo monto al precio abonado existente
    pedido.precioAbonado = Number(pedido.precioAbonado) + Number(monto);

    // Asegurar que no exceda el precio total
    if (pedido.precioAbonado > pedido.precio) {
      pedido.precioAbonado = pedido.precio;
    }

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

  async getReporteMensual(meses: number = 6): Promise<any[]> {
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - meses);
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

    const raw = await this.pedidoRepository.createQueryBuilder('pedido')
      .select([
        "EXTRACT(YEAR FROM pedido.fecha)::int AS año",
        "EXTRACT(MONTH FROM pedido.fecha)::int AS mes",
        "SUM(pedido.precio)::float AS totalventas",
        "SUM(pedido.\"precioAbonado\")::float AS totalcobrado",
        "COUNT(*)::int AS cantidadpedidos",
        "SUM(CASE WHEN pedido.estado = 'Pago' THEN 1 ELSE 0 END)::int AS cantidadpagos",
        "SUM(CASE WHEN pedido.estado = 'Impago' THEN 1 ELSE 0 END)::int AS cantidadimpagos",
      ])
      .where('pedido.fecha >= :fechaInicio', { fechaInicio: fechaInicioStr })
      .groupBy("EXTRACT(YEAR FROM pedido.fecha), EXTRACT(MONTH FROM pedido.fecha)")
      .orderBy("EXTRACT(YEAR FROM pedido.fecha)", "ASC")
      .addOrderBy("EXTRACT(MONTH FROM pedido.fecha)", "ASC")
      .getRawMany();

    return raw.map(r => ({
      año: r.año,
      mes: r.mes,
      totalVentas: Number(r.totalventas) || 0,
      totalCobrado: Number(r.totalcobrado) || 0,
      cantidadPedidos: Number(r.cantidadpedidos) || 0,
      cantidadPagos: Number(r.cantidadpagos) || 0,
      cantidadImpagos: Number(r.cantidadimpagos) || 0,
    }));
  }

  async getTopClientes(limite: number = 5): Promise<any[]> {
    const raw = await this.pedidoRepository.createQueryBuilder('pedido')
      .leftJoin('pedido.cliente', 'cliente')
      .select([
        'cliente.id AS clienteid',
        'cliente.nombre AS nombre',
        'SUM(pedido.precio)::float AS totalcomprado',
        'SUM(pedido.\"precioAbonado\")::float AS totalcobrado',
        'COUNT(*)::int AS cantidadpedidos',
      ])
      .groupBy('cliente.id, cliente.nombre')
      .orderBy('totalcomprado', 'DESC')
      .limit(limite)
      .getRawMany();

    return raw.map(r => ({
      clienteId: r.clienteid,
      nombre: r.nombre,
      totalComprado: Number(r.totalcomprado) || 0,
      totalCobrado: Number(r.totalcobrado) || 0,
      totalPendiente: (Number(r.totalcomprado) || 0) - (Number(r.totalcobrado) || 0),
      cantidadPedidos: Number(r.cantidadpedidos) || 0,
    }));
  }

  async getReportes(meses: number = 6): Promise<any> {
    const [estadisticas, reporteMensual, topClientes] = await Promise.all([
      this.getEstadisticas(),
      this.getReporteMensual(meses),
      this.getTopClientes(5),
    ]);
    return { estadisticas, reporteMensual, topClientes };
  }

  async getEstadisticas(filtros: FiltrosPedidosDto = {}): Promise<any> {
    const pedidos = await this.buildBaseQuery(filtros).getMany();

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
