import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Location } from '../../locations/entities/location.entity';
import { Article } from '../../articles/entities/article.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  id_inventario: number;

  @Column({ type: 'int', default: 0 })
  cantidad_actual: number;

  @UpdateDateColumn()
  ultima_actualizacion: Date;

  @ManyToOne(() => Location, (location) => location.inventarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @ManyToOne(() => Article, (article) => article.inventarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'article_id' })
  article: Article;
}
