import { EstadoFactura, MetodoPago } from '../../modules/facturacion/entities/factura.entity';

/**
 * Seed del historial de facturas del hosting (8 meses: Dic-2025 → Jul-2026).
 *
 * Refleja que el cliente "viene atrasado":
 *  - Dic-2025 … May-2026 → PAGADAS (6 meses)
 *  - Jun-2026            → PENDIENTE (mes anterior impago → dispara el bloqueo)
 *  - Jul-2026            → PENDIENTE (mes actual)
 */

const MONTO = Number(process.env.HOSTING_MONTO) || 23000;

const PERIODOS = [
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
];

const PAGADOS = new Set([
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
]);

export interface FacturaSeed {
  periodo: string;
  monto: number;
  moneda: string;
  estado: EstadoFactura;
  fechaEmision: Date;
  fechaVencimiento: string;
  fechaPago: Date | null;
  metodoPago: MetodoPago | null;
}

export const FACTURAS_SEED: FacturaSeed[] = PERIODOS.map((periodo) => {
  const [anio, mes] = periodo.split('-').map(Number);
  const pagado = PAGADOS.has(periodo);
  const diaPago = 3 + (mes % 3); // varía entre el 3 y el 5

  return {
    periodo,
    monto: MONTO,
    moneda: 'ARS',
    estado: pagado ? EstadoFactura.PAGADO : EstadoFactura.PENDIENTE,
    // Emisión el día 1 del período (mediodía UTC para evitar corrimientos de zona horaria)
    fechaEmision: new Date(Date.UTC(anio, mes - 1, 1, 12, 0, 0)),
    fechaVencimiento: `${periodo}-10`,
    fechaPago: pagado ? new Date(Date.UTC(anio, mes - 1, diaPago, 15, 0, 0)) : null,
    metodoPago: pagado ? MetodoPago.MERCADOPAGO : null,
  };
});
