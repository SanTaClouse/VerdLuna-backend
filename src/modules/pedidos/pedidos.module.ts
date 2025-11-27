import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { Pedido } from './entities/pedido.entity';
import { ClienteModule } from '../cliente/cliente.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido]), ClienteModule],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
