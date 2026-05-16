import { TipoUbicacion } from '../enums/ubicacion-tipo.enum';
import { EstadoUbicacion } from '../enums/ubicacion-estado.enum';

export class LocationResponseDto {
  id_ubicacion: number;
  codigo_ubicacion: string;
  nombre: string;
  tipo_ubicacion: TipoUbicacion;
  costo_almacenamiento_mensual: number;
  estado: EstadoUbicacion;
}

export class LocationInventoryResponseDto {
  id_ubicacion: number;
  nombre: string;
  costo_almacenamiento_mensual: number;
  inventario: {
    id_articulo: number;
    codigo: string;
    nombre: string;
    cantidad_actual: number;
    costo_unitario: number;
    precio_unitario: number;
    valor_total_inventario: number;
    ultima_actualizacion: Date;
  }[];
}
