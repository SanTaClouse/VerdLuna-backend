import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateEstadoPedidoDto {
  @ApiProperty({
    description: 'Nuevo monto abonado',
    example: 10000,
  })
  @IsNotEmpty({ message: 'El monto abonado es requerido' })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0, { message: 'El monto debe ser mayor o igual a 0' })
  precioAbonado: number;
}
