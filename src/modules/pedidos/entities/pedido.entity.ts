import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  Check,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Cliente } from '../../cliente/entities/cliente.entity';
import { User } from '../../users/entities/user.entity';

export enum EstadoPedido {
  PAGO = 'Pago',
  IMPAGO = 'Impago',
}

@Entity('pedidos')
@Check(`"precioAbonado" <= "precio"`)
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único del pedido' })
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  @ApiProperty({ description: 'ID del cliente' })
  clienteId: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'Descripción detallada del pedido', example: '10 kg papa, 5 kg cebolla' })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({ description: 'Precio total del pedido', example: 15000.50 })
  precio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @ApiProperty({ description: 'Monto abonado', example: 5000, default: 0 })
  precioAbonado: number;

  @Column({
    type: 'enum',
    enum: EstadoPedido,
  })
  @Index()
  @ApiProperty({ enum: EstadoPedido, description: 'Estado de pago del pedido' })
  estado: EstadoPedido;

  @Column({ type: 'date' })
  @Index()
  @ApiProperty({ description: 'Fecha del pedido (YYYY-MM-DD)', example: '2025-01-15' })
  fecha: string;

  @Column({ type: 'uuid', nullable: true })
  @ApiProperty({ description: 'ID del usuario que creó el pedido', required: false })
  creadoPorId: string;

  @CreateDateColumn()
  @Index()
  @ApiProperty({ description: 'Timestamp de creación' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Timestamp de última actualización' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Cliente, (cliente) => cliente.pedidos, { eager: true })
  @JoinColumn({ name: 'clienteId' })
  @ApiProperty({ type: () => Cliente })
  cliente: Cliente;

  @ManyToOne(() => User, (user) => user.pedidos, { nullable: true })
  @JoinColumn({ name: 'creadoPorId' })
  @ApiProperty({ type: () => User, required: false })
  creadoPor: User;

  // Hook para calcular estado automáticamente
  @BeforeInsert()
  @BeforeUpdate()
  calcularEstado() {
    const precio = Number(this.precio);
    const abonado = Number(this.precioAbonado);
    this.estado = abonado >= precio ? EstadoPedido.PAGO : EstadoPedido.IMPAGO;
  }
}