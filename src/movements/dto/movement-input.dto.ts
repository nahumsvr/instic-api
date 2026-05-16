import { IsInt, IsOptional } from 'class-validator';
import { BaseMovementDto } from './base-movement.dto';

export class MovementInputDto extends BaseMovementDto {
  @IsInt()
  @IsOptional()
  originId?: number; // Opcional si viene directamente de un proveedor externo

  @IsInt()
  destinationId: number;
}
