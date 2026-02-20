import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, MaxLength, Min } from 'class-validator';
import { CategoriaProducto, UnidadProducto } from '../entities/producto.entity';

export class CreateProductoDto {
  @IsString()
  @MaxLength(150)
  nombre: string;

  @IsEnum(CategoriaProducto)
  categoria: CategoriaProducto;

  @IsEnum(UnidadProducto)
  @IsOptional()
  unidad?: UnidadProducto;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  orden?: number;
}
