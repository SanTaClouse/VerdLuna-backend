import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MercaderiaService } from './mercaderia.service';
import { MercaderiaController } from './mercaderia.controller';
import { Producto } from './entities/producto.entity';
import { Stock } from './entities/stock.entity';
import { StockHistorial } from './entities/stock-historial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Stock, StockHistorial])],
  controllers: [MercaderiaController],
  providers: [MercaderiaService],
})
export class MercaderiaModule {}
