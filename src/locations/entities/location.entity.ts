import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TipoUbicacion } from '../enums/ubicacion-tipo.enum';
import { EstadoUbicacion } from '../enums/ubicacion-estado.enum';
import { Inventory } from '../../inventory/entities/inventory.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn()
  id_ubicacion: number;

  @Column({ unique: true })
  codigo_ubicacion: string;

  @Column()
  nombre: string;

  @Column({
    type: 'enum',
    enum: TipoUbicacion,
  })
  tipo_ubicacion: TipoUbicacion;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costo_almacenamiento_mensual: number;

  @Column({
    type: 'enum',
    enum: EstadoUbicacion,
    default: EstadoUbicacion.ACTIVO,
  })
  estado: EstadoUbicacion;

  @OneToMany(() => Inventory, (inventory) => inventory.location)
  inventarios: Inventory[];
}
