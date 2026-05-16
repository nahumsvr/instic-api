import { IsNumber, Min, IsNotEmpty } from 'class-validator';

export class UpdateStorageCostDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  costo_almacenamiento_mensual: number;
}
