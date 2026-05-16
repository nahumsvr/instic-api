import { IsEnum, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { MovementStatus } from '../../movements/enums/movement-status.enum';

export class UpdateOrderStateDto {
  @IsEnum(MovementStatus)
  @IsNotEmpty()
  status: MovementStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  etaDays?: number; // Requerido condicionalmente cuando el estado pasa a APPROVED
}
