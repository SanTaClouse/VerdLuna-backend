import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Stock } from './stock.entity';
import { StockHistorial } from './stock-historial.entity';

export enum CategoriaProducto {
  VERDURAS_HORTALIZAS = 'Verduras y Hortalizas',
  FRUTAS = 'Frutas',
  VERDURAS_HOJA = 'Verduras de Hoja y Otros',
  VARIOS_ELABORADOS = 'Varios y Elaborados',
}

export enum UnidadProducto {
  KG = 'kg',
  UNIDAD = 'unidad',
}

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'enum', enum: CategoriaProducto })
  categoria: CategoriaProducto;

  @Column({ type: 'enum', enum: UnidadProducto, default: UnidadProducto.KG })
  unidad: UnidadProducto;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'integer', default: 0 })
  orden: number;

  @OneToMany(() => Stock, (stock) => stock.producto)
  stocks: Stock[];

  @OneToMany(() => StockHistorial, (historial) => historial.producto)
  historial: StockHistorial[];
}
