import { IsInt } from 'class-validator';
import { BaseMovementDto } from './base-movement.dto';

export class MovementTransferDto extends BaseMovementDto {
  @IsInt()
  originId: number;

  @IsInt()
  destinationId: number;
}
