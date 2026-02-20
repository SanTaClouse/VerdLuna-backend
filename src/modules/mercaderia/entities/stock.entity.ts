import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Producto } from './producto.entity';

@Entity('stock')
@Unique(['productoId', 'sucursalId'])
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productoId: string;

  @Column({ type: 'integer' })
  sucursalId: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  cantidad: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Producto, (producto) => producto.stocks)
  @JoinColumn({ name: 'productoId' })
  producto: Producto;
}
