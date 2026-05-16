import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { RegisterDemandDto } from './dto/register-demand.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Demand } from './entities/demand.entity';
import { Repository, Like, ILike } from 'typeorm';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Location } from '../locations/entities/location.entity';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Demand)
    private readonly demandRepository: Repository<Demand>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(createArticleDto: CreateArticleDto) {
    const existing = await this.articleRepository.findOne({ where: { codigo: createArticleDto.code } });
    if (existing) {
      throw new ConflictException(`El artículo con el código ${createArticleDto.code} ya existe.`);
    }

    const article = this.articleRepository.create({
      codigo: createArticleDto.code,
      nombre: createArticleDto.name,
      description: createArticleDto.description,
      category: createArticleDto.category,
      size: createArticleDto.size,
      costo_unitario: createArticleDto.unitCost,
      precio_unitario: createArticleDto.unitPrice,
    });

    const savedArticle = await this.articleRepository.save(article);

    if (createArticleDto.stockConfigs && createArticleDto.stockConfigs.length > 0) {
      const inventories: Inventory[] = [];
      for (const config of createArticleDto.stockConfigs) {
        const location = await this.locationRepository.findOne({ where: { id_ubicacion: config.locationId } });
        if (!location) {
          throw new NotFoundException(`La ubicación con ID ${config.locationId} no existe.`);
        }
        const inventory = this.inventoryRepository.create({
          article: savedArticle,
          location: location,
          cantidad_actual: 0,
          stock_minimo: config.minStock,
          stock_maximo: config.maxStock,
        });
        inventories.push(inventory);
      }
      await this.inventoryRepository.save(inventories);
    }

    return this.findOne(savedArticle.id_articulo);
  }

  async findAll(queryDto?: QueryArticleDto) {
    const queryBuilder = this.articleRepository.createQueryBuilder('article')
      .where('article.is_active = :isActive', { isActive: true });

    if (queryDto?.search) {
      queryBuilder.andWhere(
        '(article.nombre ILIKE :search OR article.codigo ILIKE :search)',
        { search: `%${queryDto.search}%` }
      );
    }

    if (queryDto?.category) {
      queryBuilder.andWhere('article.category = :category', { category: queryDto.category });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id_articulo: id, is_active: true },
      relations: ['inventarios', 'inventarios.location', 'demandas', 'demandas.location'],
    });

    if (!article) {
      throw new NotFoundException(`El artículo con ID ${id} no fue encontrado o está inactivo.`);
    }

    return article;
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    const article = await this.findOne(id);

    if (updateArticleDto.code && updateArticleDto.code !== article.codigo) {
      const existing = await this.articleRepository.findOne({ where: { codigo: updateArticleDto.code } });
      if (existing) {
        throw new ConflictException(`El artículo con el código ${updateArticleDto.code} ya existe.`);
      }
    }

    Object.assign(article, {
      ...(updateArticleDto.code && { codigo: updateArticleDto.code }),
      ...(updateArticleDto.name && { nombre: updateArticleDto.name }),
      ...(updateArticleDto.description !== undefined && { description: updateArticleDto.description }),
      ...(updateArticleDto.category && { category: updateArticleDto.category }),
      ...(updateArticleDto.size && { size: updateArticleDto.size }),
      ...(updateArticleDto.unitCost !== undefined && { costo_unitario: updateArticleDto.unitCost }),
      ...(updateArticleDto.unitPrice !== undefined && { precio_unitario: updateArticleDto.unitPrice }),
    });

    await this.articleRepository.save(article);
    return this.findOne(id);
  }

  async remove(id: number) {
    const article = await this.findOne(id);
    article.is_active = false;
    await this.articleRepository.save(article);
    return { message: `El artículo con ID ${id} ha sido descontinuado.` };
  }

  async registerDemand(id: number, demandDto: RegisterDemandDto) {
    const article = await this.findOne(id);
    const location = await this.locationRepository.findOne({ where: { id_ubicacion: demandDto.locationId } });

    if (!location) {
      throw new NotFoundException(`La ubicación con ID ${demandDto.locationId} no existe.`);
    }

    const demand = this.demandRepository.create({
      article: article,
      location: location,
      year: demandDto.year,
      month: demandDto.month,
      quantity: demandDto.quantity,
    });

    await this.demandRepository.save(demand);

    // Calcular pronóstico (Promedio Móvil Simple de los últimos 3 periodos por ubicación)
    const historical = await this.demandRepository.find({
      where: { article: { id_articulo: id }, location: { id_ubicacion: demandDto.locationId } },
      order: { year: 'DESC', month: 'DESC' },
      take: 3,
    });

    const totalQuantity = historical.reduce((sum, record) => sum + record.quantity, 0);
    const forecast = historical.length > 0 ? totalQuantity / historical.length : 0;

    return {
      message: 'Demanda registrada correctamente',
      forecast: Math.round(forecast),
      historicalCount: historical.length,
    };
  }
}
