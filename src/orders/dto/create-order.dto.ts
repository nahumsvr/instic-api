import { IsInt, Min } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  articleId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  originId: number;

  @IsInt()
  destinationId: number;
}
