import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EstadoFactura {
  PENDIENTE = 'pendiente',
  PAGADO = 'pagado',
}

export enum MetodoPago {
  MERCADOPAGO = 'mercadopago',
  MANUAL = 'manual',
}

/**
 * Factura mensual del hosting de la plataforma.
 * La app es mono-cliente (Verdulería La Luna), por lo que hay una fila por período (YYYY-MM).
 */
@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Período facturado en formato 'YYYY-MM' (ordenable y único). */
  @Column({ type: 'varchar', length: 7, unique: true })
  @Index()
  periodo: string;

  /** Monto del hosting en la moneda indicada. */
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 23000 })
  monto: number;

  @Column({ type: 'varchar', length: 3, default: 'ARS' })
  moneda: string;

  @Column({ type: 'enum', enum: EstadoFactura, default: EstadoFactura.PENDIENTE })
  @Index()
  estado: EstadoFactura;

  /** Día 1 del período (fecha de emisión). */
  @Column({ type: 'timestamp' })
  fechaEmision: Date;

  /** Día 10 del período: fin de la ventana de gracia. */
  @Column({ type: 'date' })
  fechaVencimiento: string;

  @Column({ type: 'timestamp', nullable: true })
  fechaPago: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  metodoPago: MetodoPago | null;

  /** ID de la preferencia de Checkout Pro de Mercado Pago. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  mpPreferenceId: string | null;

  /** ID del pago aprobado en Mercado Pago. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  mpPaymentId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
