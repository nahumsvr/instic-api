import { IsInt, IsOptional } from 'class-validator';
import { BaseMovementDto } from './base-movement.dto';

export class MovementOutputDto extends BaseMovementDto {
  @IsInt()
  originId: number;

  @IsInt()
  @IsOptional()
  destinationId?: number; // Opcional si es una venta final al cliente
}
