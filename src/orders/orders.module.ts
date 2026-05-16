import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { Article } from '../articles/entities/article.entity';
import { Location } from '../locations/entities/location.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Article, Location, Inventory]),
    JwtModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
