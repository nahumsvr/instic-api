import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementsService } from './movements.service';
import { MovementsController } from './movements.controller';
import { Movement } from './entities/movement.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Location } from '../locations/entities/location.entity';
import { Article } from '../articles/entities/article.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movement, Inventory, Location, Article]),
    JwtModule,
  ],
  controllers: [MovementsController],
  providers: [MovementsService],
})
export class MovementsModule {}
