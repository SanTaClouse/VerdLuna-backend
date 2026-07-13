import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { Factura, EstadoFactura, MetodoPago } from './entities/factura.entity';
import { FACTURAS_SEED } from '../../database/seeds/facturas.seed';

interface AhoraAR {
  periodo: string; // 'YYYY-MM'
  diaDelMes: number;
  anio: number;
  mes: number;
  iso: string;
}

@Injectable()
export class FacturacionService {
  private readonly logger = new Logger(FacturacionService.name);
  private readonly mpClient: MercadoPagoConfig | null;
  private readonly monto: number;

  constructor(
    @InjectRepository(Factura)
    private readonly facturaRepo: Repository<Factura>,
    private readonly config: ConfigService,
  ) {
    const token = this.config.get<string>('MP_ACCESS_TOKEN');
    this.mpClient = token ? new MercadoPagoConfig({ accessToken: token }) : null;
    if (!token) {
      this.logger.warn('MP_ACCESS_TOKEN no configurado: el checkout de Mercado Pago estará deshabilitado.');
    }
    this.monto = Number(this.config.get('HOSTING_MONTO')) || 23000;
  }

  // ---------------------------------------------------------------------------
  // Helpers de fecha (zona horaria Argentina)
  // ---------------------------------------------------------------------------
  private getAhoraAR(): AhoraAR {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    const get = (t: string) => parts.find((p) => p.type === t)!.value;
    const anio = Number(get('year'));
    const mes = Number(get('month'));
    const dia = Number(get('day'));

    return {
      periodo: `${get('year')}-${get('month')}`,
      diaDelMes: dia,
      anio,
      mes,
      iso: now.toISOString(),
    };
  }

  private serialize(f: Factura) {
    return { ...f, monto: Number(f.monto) };
  }

  // ---------------------------------------------------------------------------
  // Generación idempotente de la factura del período actual
  // ---------------------------------------------------------------------------
  async ensureFacturaPeriodoActual(): Promise<Factura> {
    const { periodo, anio, mes } = this.getAhoraAR();

    let factura = await this.facturaRepo.findOne({ where: { periodo } });
    if (factura) return factura;

    factura = this.facturaRepo.create({
      periodo,
      monto: this.monto,
      moneda: 'ARS',
      estado: EstadoFactura.PENDIENTE,
      fechaEmision: new Date(Date.UTC(anio, mes - 1, 1, 12, 0, 0)),
      fechaVencimiento: `${periodo}-10`,
    });

    try {
      return await this.facturaRepo.save(factura);
    } catch {
      // Condición de carrera: otra request la creó primero → recuperarla.
      const existente = await this.facturaRepo.findOne({ where: { periodo } });
      if (existente) return existente;
      throw new Error(`No se pudo generar la factura del período ${periodo}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Estado de facturación (consumido por el front en cada login/carga)
  // ---------------------------------------------------------------------------
  async getEstado() {
    const ahora = this.getAhoraAR();
    const facturaActual = await this.ensureFacturaPeriodoActual();

    const facturasVencidas = await this.facturaRepo.find({
      where: { estado: EstadoFactura.PENDIENTE, periodo: LessThan(ahora.periodo) },
      order: { periodo: 'ASC' },
    });

    const bloqueado = facturasVencidas.length > 0;
    const actualPendiente = facturaActual.estado === EstadoFactura.PENDIENTE;
    const mostrarAviso = !bloqueado && actualPendiente && ahora.diaDelMes <= 5;

    const pendientes = [...facturasVencidas];
    if (actualPendiente) pendientes.push(facturaActual);
    const montoAdeudado = pendientes.reduce((sum, f) => sum + Number(f.monto), 0);

    return {
      hoy: ahora.iso,
      diaDelMes: ahora.diaDelMes,
      periodoActual: ahora.periodo,
      facturaActual: this.serialize(facturaActual),
      bloqueado,
      mostrarAviso,
      facturasVencidas: facturasVencidas.map((f) => this.serialize(f)),
      montoAdeudado,
    };
  }

  async getHistorial() {
    const facturas = await this.facturaRepo.find({ order: { periodo: 'DESC' } });
    return facturas.map((f) => this.serialize(f));
  }

  async getById(id: string) {
    const factura = await this.facturaRepo.findOne({ where: { id } });
    if (!factura) throw new NotFoundException('Factura no encontrada');
    return this.serialize(factura);
  }

  // ---------------------------------------------------------------------------
  // Mercado Pago: crear checkout (Checkout Pro)
  // ---------------------------------------------------------------------------
  async crearCheckout(facturaId: string) {
    const factura = await this.facturaRepo.findOne({ where: { id: facturaId } });
    if (!factura) throw new NotFoundException('Factura no encontrada');
    if (factura.estado === EstadoFactura.PAGADO) {
      throw new BadRequestException('La factura ya está pagada');
    }
    if (!this.mpClient) {
      throw new ServiceUnavailableException(
        'Mercado Pago no está configurado (falta MP_ACCESS_TOKEN)',
      );
    }

    const frontUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const backUrl = this.config.get<string>('BACKEND_PUBLIC_URL');

    const body: any = {
      items: [
        {
          id: factura.id,
          title: `Hosting BackOffice Luna - ${factura.periodo}`,
          quantity: 1,
          unit_price: Number(factura.monto),
          currency_id: 'ARS',
        },
      ],
      external_reference: factura.id,
      back_urls: {
        success: `${frontUrl}/administracion?pago=success`,
        failure: `${frontUrl}/administracion?pago=failure`,
        pending: `${frontUrl}/administracion?pago=pending`,
      },
      auto_return: 'approved',
    };

    // La notification_url requiere que el backend sea accesible públicamente.
    if (backUrl) {
      body.notification_url = `${backUrl}/api/facturacion/webhook`;
    }

    const preference = new Preference(this.mpClient);
    const result = await preference.create({ body });

    factura.mpPreferenceId = result.id ?? null;
    await this.facturaRepo.save(factura);

    return { initPoint: result.init_point, preferenceId: result.id };
  }

  // ---------------------------------------------------------------------------
  // Mercado Pago: webhook de notificación de pagos
  // ---------------------------------------------------------------------------
  async procesarWebhook(query: any, body: any, headers: any) {
    const tipo = body?.type ?? query?.type ?? query?.topic;
    const paymentId = body?.data?.id ?? query?.['data.id'] ?? query?.id;

    if (tipo !== 'payment' || !paymentId) {
      return { ignored: true };
    }

    if (!this.verificarFirma(headers, String(paymentId))) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }

    if (!this.mpClient) {
      this.logger.warn('Webhook recibido pero MP no está configurado; se ignora.');
      return { ignored: true };
    }

    const payment = new Payment(this.mpClient);
    const pago = await payment.get({ id: String(paymentId) });

    if (pago.status !== 'approved' || !pago.external_reference) {
      return { procesado: false, estadoPago: pago.status };
    }

    const factura = await this.facturaRepo.findOne({
      where: { id: String(pago.external_reference) },
    });
    if (!factura) {
      this.logger.warn(`Webhook: factura ${pago.external_reference} no encontrada.`);
      return { procesado: false };
    }

    // Idempotente: si ya está pagada, no hacemos nada.
    if (factura.estado !== EstadoFactura.PAGADO) {
      factura.estado = EstadoFactura.PAGADO;
      factura.fechaPago = new Date();
      factura.metodoPago = MetodoPago.MERCADOPAGO;
      factura.mpPaymentId = String(pago.id);
      await this.facturaRepo.save(factura);
      this.logger.log(`Factura ${factura.periodo} marcada como PAGADA (pago ${pago.id}).`);
    }

    return { procesado: true };
  }

  /**
   * Valida la firma HMAC del webhook (header x-signature) contra MP_WEBHOOK_SECRET.
   * Si no hay secret configurado, no se valida (útil en desarrollo).
   */
  private verificarFirma(headers: any, dataId: string): boolean {
    const secret = this.config.get<string>('MP_WEBHOOK_SECRET');
    if (!secret) return true;

    const xSignature: string | undefined = headers?.['x-signature'];
    const xRequestId: string | undefined = headers?.['x-request-id'];
    if (!xSignature) return false;

    const partes = String(xSignature)
      .split(',')
      .reduce<Record<string, string>>((acc, p) => {
        const [k, v] = p.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {});

    const ts = partes['ts'];
    const hash = partes['v1'];
    if (!ts || !hash) return false;

    let manifest = `id:${dataId.toLowerCase()};`;
    if (xRequestId) manifest += `request-id:${xRequestId};`;
    manifest += `ts:${ts};`;

    const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    return computed === hash;
  }

  // ---------------------------------------------------------------------------
  // Pago manual (fallback para saldar a mano) y seed
  // ---------------------------------------------------------------------------
  async marcarPagoManual(facturaId: string) {
    const factura = await this.facturaRepo.findOne({ where: { id: facturaId } });
    if (!factura) throw new NotFoundException('Factura no encontrada');

    if (factura.estado !== EstadoFactura.PAGADO) {
      factura.estado = EstadoFactura.PAGADO;
      factura.fechaPago = new Date();
      factura.metodoPago = MetodoPago.MANUAL;
      await this.facturaRepo.save(factura);
    }
    return this.serialize(factura);
  }

  async seed(): Promise<{ insertados: number; mensaje: string }> {
    const count = await this.facturaRepo.count();
    if (count > 0) {
      return {
        insertados: 0,
        mensaje: `Ya existen ${count} facturas, no se insertaron duplicados`,
      };
    }

    await this.facturaRepo.save(this.facturaRepo.create(FACTURAS_SEED as any[]));

    const total = await this.facturaRepo.count();
    return { insertados: total, mensaje: `${total} facturas insertadas correctamente` };
  }
}
