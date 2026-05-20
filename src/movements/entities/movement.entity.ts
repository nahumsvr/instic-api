import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MovementType } from '../enums/movement-type.enum';
import { MovementStatus } from '../enums/movement-status.enum';
import { Article } from '../../articles/entities/article.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity('movements')
export class Movement {
  @PrimaryGeneratedColumn()
  id_movimiento: number;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  tipo: MovementType;

  @Column({
    type: 'enum',
    enum: MovementStatus,
    default: MovementStatus.COMPLETED,
  })
  estado: MovementStatus;

  @Column({ type: 'int' })
  cantidad: number;

  @CreateDateColumn()
  fecha_movimiento: Date;

  @Column({ type: 'varchar', nullable: true })
  motivo_anulacion: string | null;

  @ManyToOne(() => Article, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => Location, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'origin_location_id' })
  originLocation: Location | null;

  @ManyToOne(() => Location, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_location_id' })
  destinationLocation: Location | null;
}
