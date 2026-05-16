import { IsString, IsEnum, IsNumber, IsNotEmpty, Min, IsOptional } from 'class-validator';
import { TipoUbicacion } from '../enums/ubicacion-tipo.enum';
import { EstadoUbicacion } from '../enums/ubicacion-estado.enum';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  codigo_ubicacion: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum(TipoUbicacion)
  @IsNotEmpty()
  tipo_ubicacion: TipoUbicacion;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  costo_almacenamiento_mensual: number;

  @IsOptional()
  @IsEnum(EstadoUbicacion)
  estado?: EstadoUbicacion;
}
