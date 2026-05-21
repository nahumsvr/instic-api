import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
      if (error.code === '23503') {
        // Foreign key violation in PostgreSQL
        throw new BadRequestException('La ubicación o el artículo no existen');
      }
      if (error.code === '23505') {
        // Unique constraint violation
        throw new BadRequestException(
          'El inventario para esta ubicación y artículo ya existe',
        );
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

  async update(id: number, updateInventoryDto: UpdateInventoryDto) {
    const record = await this.inventoryRepository.findOne({
      where: { id_inventario: id },
    });

    if (!record) {
      throw new NotFoundException(
        `No se encontró un registro de inventario con ID ${id}.`,
      );
    }

    if (updateInventoryDto.stock_minimo !== undefined) {
      record.stock_minimo = updateInventoryDto.stock_minimo;
    }
    if (updateInventoryDto.stock_maximo !== undefined) {
      record.stock_maximo = updateInventoryDto.stock_maximo;
    }

    return this.inventoryRepository.save(record);
  }

  remove(id: number) {
    return `This action removes a #${id} inventory`;
  }

  // ─── GET /inventory?articleId=X ──────────────────────────────────────────

  async findByArticle(articleId: number) {
    const records = await this.inventoryRepository.find({
      where: { article: { id_articulo: articleId } },
      relations: ['article', 'location'],
    });

    if (!records.length) {
      throw new NotFoundException(
        `No se encontró inventario para el artículo con id ${articleId}`,
      );
    }

    const article = records[0].article;

    const totalStock = records.reduce(
      (sum, r) => sum + Number(r.cantidad_actual),
      0,
    );

    const locations = records
      .filter((r) => Number(r.cantidad_actual) > 0)
      .map((r) => ({
        inventoryId: r.id_inventario,
        location: {
          id: r.location.id_ubicacion,
          code: r.location.codigo_ubicacion,
          name: r.location.nombre,
          type: r.location.tipo_ubicacion,
          status: r.location.estado,
        },
        stockActual: Number(r.cantidad_actual),
        stockMinimo: Number(r.stock_minimo),
        stockMaximo: Number(r.stock_maximo),
        lastUpdated: r.ultima_actualizacion,
      }));

    return {
      article: {
        id: article.id_articulo,
        code: article.codigo,
        name: article.nombre,
        description: article.description,
        category: article.category,
        size: article.size,
        unitCost: Number(article.costo_unitario),
        unitPrice: Number(article.precio_unitario),
        isActive: article.is_active,
      },
      totalStock,
      locationCount: locations.length,
      locations,
    };
  }
}
