import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MercaderiaService } from './mercaderia.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { AjustarStockDto } from './dto/ajustar-stock.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategies/guards/jwt-auth.guard';

@ApiTags('Mercadería')
@Controller('mercaderia')
export class MercaderiaController {
  constructor(private readonly mercaderiaService: MercaderiaService) {}

  @Get('productos')
  @UseGuards(JwtAuthGuard)
  async getProductos() {
    const data = await this.mercaderiaService.getProductos();
    return { data };
  }

  @Post('productos')
  @UseGuards(JwtAuthGuard)
  async createProducto(@Body() dto: CreateProductoDto) {
    const data = await this.mercaderiaService.createProducto(dto);
    return { data };
  }

  @Get('stock/:sucursalId')
  @UseGuards(JwtAuthGuard)
  async getStockSucursal(@Param('sucursalId', ParseIntPipe) sucursalId: number) {
    const data = await this.mercaderiaService.getStockSucursal(sucursalId);
    return { data };
  }

  @Patch('stock/:sucursalId/:productoId')
  @UseGuards(JwtAuthGuard)
  async ajustarStock(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Param('productoId') productoId: string,
    @Body() dto: AjustarStockDto,
    @Req() req: any,
  ) {
    const usuarioId: string | undefined = req.user?.id;
    const data = await this.mercaderiaService.ajustarStock(sucursalId, productoId, dto, usuarioId);
    return { data };
  }

  @Get('historial/:sucursalId')
  @UseGuards(JwtAuthGuard)
  async getHistorial(@Param('sucursalId', ParseIntPipe) sucursalId: number) {
    const data = await this.mercaderiaService.getHistorial(sucursalId);
    return { data };
  }

  // Endpoint one-time, sin autenticación para facilitar setup
  @Post('seed')
  async seed() {
    const data = await this.mercaderiaService.seed();
    return { data };
  }
}
