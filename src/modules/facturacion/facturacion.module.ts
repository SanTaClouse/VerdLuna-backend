import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturacionService } from './facturacion.service';
import { FacturacionController } from './facturacion.controller';
import { Factura } from './entities/factura.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Factura])],
  controllers: [FacturacionController],
  providers: [FacturacionService],
})
export class FacturacionModule {}
