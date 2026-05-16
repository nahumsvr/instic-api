import { IsEnum, IsNotEmpty } from 'class-validator';
import { MovementStatus } from '../enums/movement-status.enum';

export class UpdateMovementStatusDto {
  @IsEnum(MovementStatus)
  @IsNotEmpty()
  status: MovementStatus;
}
