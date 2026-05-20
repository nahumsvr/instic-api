import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Article } from './article.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity('demand')
export class Demand {
  @PrimaryGeneratedColumn()
  id_demand: number;

  @Column()
  year: number;

  @Column()
  month: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @ManyToOne(() => Article, (article) => article.demandas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => Location, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'location_id' })
  location: Location;
}
