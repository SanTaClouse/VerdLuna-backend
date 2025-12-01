import { ApiProperty } from '@nestjs/swagger';
import { Pedido } from '../entities/pedido.entity';

export class CreatePedidoResponseDto {
  @ApiProperty({
    description: 'Pedido creado',
    type: () => Pedido,
  })
  pedido: Pedido;

  @ApiProperty({
    description: 'Link de WhatsApp para enviar detalles del pedido al cliente',
    example: 'https://wa.me/5493424123456?text=Hola%20Juan...',
  })
  whatsappLink: string;
}