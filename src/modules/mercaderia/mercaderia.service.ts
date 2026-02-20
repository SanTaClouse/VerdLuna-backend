import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { Stock } from './entities/stock.entity';
import { StockHistorial } from './entities/stock-historial.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { AjustarStockDto, TipoAjuste } from './dto/ajustar-stock.dto';
import { PRODUCTOS_SEED } from '../../database/seeds/productos.seed';

@Injectable()
export class MercaderiaService {
  constructor(
    @InjectRepository(Producto)
    private productoRepo: Repository<Producto>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(StockHistorial)
    private historialRepo: Repository<StockHistorial>,
  ) {}

  async getProductos(): Promise<Producto[]> {
    return this.productoRepo.find({
      where: { activo: true },
      order: { categoria: 'ASC', orden: 'ASC', nombre: 'ASC' },
    });
  }

  async createProducto(dto: CreateProductoDto): Promise<Producto> {
    const producto = this.productoRepo.create(dto);
    return this.productoRepo.save(producto);
  }

  async getStockSucursal(sucursalId: number): Promise<any[]> {
    const productos = await this.productoRepo.find({
      where: { activo: true },
      order: { categoria: 'ASC', orden: 'ASC', nombre: 'ASC' },
    });

    const stocks = await this.stockRepo.find({ where: { sucursalId } });
    const stockMap = new Map(stocks.map((s) => [s.productoId, s]));

    return productos.map((p) => {
      const stock = stockMap.get(p.id);
      return {
        producto: p,
        stock: stock ? Number(stock.cantidad) : 0,
        stockId: stock?.id ?? null,
        updatedAt: stock?.updatedAt ?? null,
      };
    });
  }

  async ajustarStock(
    sucursalId: number,
    productoId: string,
    dto: AjustarStockDto,
    usuarioId?: string,
  ): Promise<{ stock: number; updatedAt: Date }> {
    const producto = await this.productoRepo.findOne({ where: { id: productoId } });
    if (!producto) {
      throw new NotFoundException(`Producto ${productoId} no encontrado`);
    }

    let stockRecord = await this.stockRepo.findOne({ where: { productoId, sucursalId } });

    const cantidadAnterior = stockRecord ? Number(stockRecord.cantidad) : 0;

    let cantidadNueva: number;
    if (dto.tipo === TipoAjuste.SET) {
      cantidadNueva = dto.cantidad;
    } else {
      cantidadNueva = cantidadAnterior + dto.cantidad;
    }

    if (cantidadNueva < 0) cantidadNueva = 0;

    if (!stockRecord) {
      stockRecord = this.stockRepo.create({ productoId, sucursalId, cantidad: cantidadNueva });
    } else {
      stockRecord.cantidad = cantidadNueva;
    }

    await this.stockRepo.save(stockRecord);

    const diferencia = cantidadNueva - cantidadAnterior;
    await this.historialRepo.save(
      this.historialRepo.create({
        productoId,
        sucursalId,
        cantidadAnterior,
        cantidadNueva,
        diferencia,
        usuarioId: usuarioId ?? null,
      }),
    );

    return { stock: cantidadNueva, updatedAt: stockRecord.updatedAt };
  }

  async getHistorial(sucursalId: number): Promise<StockHistorial[]> {
    return this.historialRepo.find({
      where: { sucursalId },
      relations: ['producto'],
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async seed(): Promise<{ insertados: number; mensaje: string }> {
    const count = await this.productoRepo.count();
    if (count > 0) {
      return {
        insertados: 0,
        mensaje: `Ya existen ${count} productos, no se insertaron duplicados`,
      };
    }

    await this.productoRepo.save(this.productoRepo.create(PRODUCTOS_SEED as any[]));

    const total = await this.productoRepo.count();
    return { insertados: total, mensaje: `${total} productos insertados correctamente` };
  }
}
