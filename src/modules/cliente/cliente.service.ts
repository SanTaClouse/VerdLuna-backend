import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';

@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    const cliente = this.clienteRepository.create(createClienteDto);
    return this.clienteRepository.save(cliente);
  }

  async findAll(): Promise<Cliente[]> {
    return this.clienteRepository.find({
      where: { isDeleted: false },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return cliente;
  }

  async update(id: string, updateClienteDto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.findOne(id);

    Object.assign(cliente, updateClienteDto);

    return this.clienteRepository.save(cliente);
  }

  async remove(id: string): Promise<void> {
    const cliente = await this.findOne(id);

    cliente.isDeleted = true;
    cliente.fechaBaja = new Date();

    await this.clienteRepository.save(cliente);
  }

  async actualizarEstadisticas(clienteId: string): Promise<void> {
    const result = await this.clienteRepository
      .createQueryBuilder('cliente')
      .leftJoinAndSelect('cliente.pedidos', 'pedido')
      .where('cliente.id = :clienteId', { clienteId })
      .select('SUM(pedido.precio)', 'total')
      .addSelect('COUNT(pedido.id)', 'cantidad')
      .addSelect('MAX(pedido.fecha)', 'ultimaFecha')
      .getRawOne();

    await this.clienteRepository.update(clienteId, {
      totalFacturado: result.total || 0,
      cantidadPedidos: parseInt(result.cantidad) || 0,
      ultimoPedido: result.ultimaFecha || null,
    });
  }
}
