import { IsInt, Min, IsOptional, IsEnum } from 'class-validator';
import { MovementStatus } from '../enums/movement-status.enum';

export class BaseMovementDto {
  @IsInt()
  articleId: number;

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;

  @IsEnum(MovementStatus)
  @IsOptional()
  status?: MovementStatus;
}
