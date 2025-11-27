import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsNumber,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreatePedidoDto {
  @ApiProperty({
    description: 'ID del cliente',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  clienteId: string;

  @ApiProperty({
    description: 'Descripción detallada del pedido',
    example: '10 kg de papa, 5 kg de cebolla, 3 kg de zanahoria',
  })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @IsString()
  descripcion: string;

  @ApiProperty({
    description: 'Precio total del pedido',
    example: 15000.50,
  })
  @IsNotEmpty({ message: 'El precio es requerido' })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  precio: number;

  @ApiProperty({
    description: 'Monto abonado',
    example: 5000,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El precio abonado debe ser un número' })
  @Min(0, { message: 'El precio abonado debe ser mayor o igual a 0' })
  precioAbonado?: number;

  @ApiProperty({
    description: 'Fecha del pedido (YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  fecha: string;
}
