import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ReportesQueryDto {
  @ApiProperty({
    description: 'Cantidad de meses hacia atrás a incluir en el reporte (máximo 24)',
    required: false,
    default: 6,
    example: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  meses?: number;
}
