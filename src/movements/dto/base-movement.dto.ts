import { IsInt, Min } from 'class-validator';

export class BaseMovementDto {
  @IsInt()
  articleId: number;

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;
}
