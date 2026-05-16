import { IsEnum, IsOptional } from 'class-validator';
import { MovementType } from '../enums/movement-type.enum';
import { Transform } from 'class-transformer';

export class QueryMovementDto {
  @IsEnum(MovementType)
  @IsOptional()
  type?: MovementType;

  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  locationId?: number;
}
