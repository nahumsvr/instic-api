import { IsInt, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsInt()
  locationId: number;

  @IsInt()
  articleId: number;

  @IsInt()
  @Min(0)
  cantidad_actual: number;

  @IsInt()
  @Min(0)
  stock_minimo: number;

  @IsInt()
  @Min(0)
  stock_maximo: number;
}
