import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Pedido } from '../../pedidos/entities/pedido.entity';

export enum EstadoCliente {
  ACTIVO = 'Activo',
  INACTIVO = 'Inactivo',
}

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único del cliente' })
  id: string;

  @Column({ type: 'varchar', length: 150 })
  @Index()
  @ApiProperty({ description: 'Nombre o razón social del cliente', example: 'Verdulería El Sol' })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: 'Dirección completa', example: 'San Martín 456, Maciel' })
  direccion: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  @ApiProperty({ description: 'Teléfono de contacto', example: '3434569846' })
  telefono: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiProperty({ description: 'Email del cliente', example: 'cliente@example.com', required: false })
  email: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Descripción o notas del cliente', required: false })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: EstadoCliente,
    default: EstadoCliente.ACTIVO,
  })
  @Index()
  @ApiProperty({ enum: EstadoCliente, description: 'Estado del cliente', default: EstadoCliente.ACTIVO })
  estado: EstadoCliente;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ description: 'Total facturado acumulado', example: 150000.50, default: 0 })
  totalFacturado: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({ description: 'Cantidad de pedidos realizados', example: 15, default: 0 })
  cantidadPedidos: number;

  @Column({ type: 'date', nullable: true })
  @ApiProperty({ description: 'Fecha del último pedido', example: '2025-01-15', required: false })
  ultimoPedido: Date;

  @CreateDateColumn()
  @ApiProperty({ description: 'Fecha de registro del cliente' })
  fechaRegistro: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({ description: 'Borrado lógico', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'Fecha de baja (si fue eliminado)', required: false })
  fechaBaja: Date;

  // Relaciones
  @OneToMany(() => Pedido, (pedido) => pedido.cliente)
  pedidos: Pedido[];
}