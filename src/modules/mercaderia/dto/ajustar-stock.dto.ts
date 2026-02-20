import { IsNumber, IsEnum } from 'class-validator';

export enum TipoAjuste {
  SET = 'set',
  AJUSTE = 'ajuste',
}

export class AjustarStockDto {
  @IsNumber()
  cantidad: number;

  @IsEnum(TipoAjuste)
  tipo: TipoAjuste;
}
