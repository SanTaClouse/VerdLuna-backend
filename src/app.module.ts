import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { ClienteModule } from './modules/cliente/cliente.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PedidosModule,
    ClienteModule],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }
