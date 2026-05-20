import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateStorageCostDto } from './dto/update-location.dto';
import {
  LocationResponseDto,
  LocationInventoryResponseDto,
} from './dto/location-response.dto';
import { EstadoUbicacion } from './enums/ubicacion-estado.enum';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationsRepository: Repository<Location>,
  ) {}

  async create(
    createLocationDto: CreateLocationDto,
  ): Promise<LocationResponseDto> {
    const existing = await this.locationsRepository.findOne({
      where: { codigo_ubicacion: createLocationDto.codigo_ubicacion },
    });
    if (existing) {
      throw new ConflictException('Ya existe una ubicación con este código');
    }

    const location = this.locationsRepository.create(createLocationDto);
    const saved = await this.locationsRepository.save(location);

    return saved;
  }

  async findAll(): Promise<LocationResponseDto[]> {
    return this.locationsRepository.find({
      where: { estado: EstadoUbicacion.ACTIVO },
    });
  }

  async getInventory(id: number): Promise<LocationInventoryResponseDto> {
    const location = await this.locationsRepository.findOne({
      where: { id_ubicacion: id },
      relations: ['inventarios', 'inventarios.article'],
    });

    if (!location) {
      throw new NotFoundException('Ubicación no encontrada');
    }

    const inventario =
      location.inventarios?.map((inv) => ({
        id_articulo: inv.article.id_articulo,
        codigo: inv.article.codigo,
        nombre: inv.article.nombre,
        cantidad_actual: inv.cantidad_actual,
        costo_unitario: Number(inv.article.costo_unitario),
        precio_unitario: Number(inv.article.precio_unitario),
        valor_total_inventario:
          inv.cantidad_actual * Number(inv.article.costo_unitario),
        ultima_actualizacion: inv.ultima_actualizacion,
      })) || [];

    return {
      id_ubicacion: location.id_ubicacion,
      nombre: location.nombre,
      costo_almacenamiento_mensual: Number(
        location.costo_almacenamiento_mensual,
      ),
      inventario,
    };
  }

  async updateStorageCost(
    id: number,
    updateStorageCostDto: UpdateStorageCostDto,
  ): Promise<LocationResponseDto> {
    const location = await this.locationsRepository.findOne({
      where: { id_ubicacion: id },
    });
    if (!location) {
      throw new NotFoundException('Ubicación no encontrada');
    }

    location.costo_almacenamiento_mensual =
      updateStorageCostDto.costo_almacenamiento_mensual;
    const updated = await this.locationsRepository.save(location);

    return updated;
  }
}
