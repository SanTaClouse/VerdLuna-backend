import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Producto } from './producto.entity';

@Entity('stock_historial')
export class StockHistorial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productoId: string;

  @Column({ type: 'integer' })
  sucursalId: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  cantidadAnterior: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  cantidadNueva: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  diferencia: number;

  @Column({ type: 'uuid', nullable: true })
  usuarioId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Producto, (producto) => producto.historial)
  @JoinColumn({ name: 'productoId' })
  producto: Producto;
}
