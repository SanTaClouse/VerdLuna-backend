import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdatePrecioAbonadoDto {
  @ApiProperty({
    description: 'Nuevo precio abonado (se sumará al existente)',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'El monto debe ser mayor o igual a 0' })
  monto: number;
}