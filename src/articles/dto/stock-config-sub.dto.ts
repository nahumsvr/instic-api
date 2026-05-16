import { IsInt, Min } from 'class-validator';

export class StockConfigSubDto {
  @IsInt()
  locationId: number;

  @IsInt()
  @Min(0)
  minStock: number;

  @IsInt()
  @Min(0)
  maxStock: number;
}
