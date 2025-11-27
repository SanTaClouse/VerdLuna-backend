import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';

export class FiltrosPedidosDto {
  @ApiProperty({
    description: 'Filtrar por ID de cliente',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID('4')
  clienteId?: string;

  @ApiProperty({
    description: 'Filtrar por estado de pago',
    enum: ['Pago', 'Impago', 'Todos'],
    required: false,
    default: 'Todos',
  })
  @IsOptional()
  @IsEnum(['Pago', 'Impago', 'Todos'])
  estado?: 'Pago' | 'Impago' | 'Todos';

  @ApiProperty({
    description: 'Fecha desde (YYYY-MM-DD)',
    required: false,
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiProperty({
    description: 'Fecha hasta (YYYY-MM-DD)',
    required: false,
    example: '2025-01-31',
  })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
