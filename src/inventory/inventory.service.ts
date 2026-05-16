import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto) {
    try {
      const newInventory = this.inventoryRepository.create({
        location: { id_ubicacion: createInventoryDto.locationId },
        article: { id_articulo: createInventoryDto.articleId },
        cantidad_actual: createInventoryDto.cantidad_actual,
        stock_minimo: createInventoryDto.stock_minimo,
        stock_maximo: createInventoryDto.stock_maximo,
      });
      return await this.inventoryRepository.save(newInventory);
    } catch (error) {
      if (error.code === '23503') { // Foreign key violation in PostgreSQL
        throw new BadRequestException('La ubicación o el artículo no existen');
      }
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('El inventario para esta ubicación y artículo ya existe');
      }
      throw error;
    }
  }

  findAll() {
    return `This action returns all inventory`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inventory`;
  }

  update(id: number, updateInventoryDto: UpdateInventoryDto) {
    return `This action updates a #${id} inventory`;
  }

  remove(id: number) {
    return `This action removes a #${id} inventory`;
  }
}
