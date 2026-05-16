import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { Demand } from './demand.entity';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id_articulo: number;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  category: string;

  @Column()
  size: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costo_unitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_unitario: number;

  @OneToMany(() => Inventory, (inventory) => inventory.article)
  inventarios: Inventory[];

  @OneToMany(() => Demand, (demand) => demand.article)
  demandas: Demand[];
}
