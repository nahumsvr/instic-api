import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MovementStatus } from '../../movements/enums/movement-status.enum';
import { Article } from '../../articles/entities/article.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id_orden: number;

  /** Código único de la orden, sirve como identificador del QR */
  @Column({ unique: true })
  qr_code: string;

  @Column({
    type: 'enum',
    enum: MovementStatus,
    default: MovementStatus.PENDING,
  })
  estado: MovementStatus;

  @Column({ type: 'int' })
  cantidad: number;

  /**
   * Días estimados de llegada — se llena cuando el estado
   * transiciona a APPROVED.
   */
  @Column({ type: 'int', nullable: true })
  eta_days: number | null;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @ManyToOne(() => Article, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'origin_id' })
  origin: Location;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'destination_id' })
  destination: Location;
}
