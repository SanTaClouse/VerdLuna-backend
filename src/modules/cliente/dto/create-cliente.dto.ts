import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  IsEmail,
  IsOptional,
} from 'class-validator';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Nombre o razón social del cliente',
    example: 'Verdulería El Sol',
  })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @Length(2, 150)
  nombre: string;

  @ApiProperty({
    description: 'Dirección completa',
    example: 'San Martín 456, Maciel',
  })
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @IsString()
  direccion: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '3434569846',
  })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @Matches(/^[0-9\s\-\+\(\)]+$/, {
    message: 'El teléfono solo puede contener números y símbolos válidos',
  })
  telefono: string;

  @ApiProperty({
    description: 'Email del cliente',
    example: 'cliente@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({
    description: 'Notas o descripción del cliente',
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
