import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { Article } from '../articles/entities/article.entity';
import { Location } from '../locations/entities/location.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStateDto } from './dto/update-order-state.dto';
import { MovementStatus } from '../movements/enums/movement-status.enum';
import { randomUUID } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  // ─── Alertas ──────────────────────────────────────────────────────────────

  /**
   * Devuelve todas las alertas activas clasificadas por severidad.
   * Una alerta se genera cuando `cantidad_actual < stock_minimo`.
   * - CRÍTICO: cantidad_actual === 0
   * - ALTO:    cantidad_actual <= stock_minimo * 0.5
   * - MEDIO:   cantidad_actual > stock_minimo * 0.5 && < stock_minimo
   */
  async getAlerts() {
    const belowMin = await this.inventoryRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.article', 'article')
      .leftJoinAndSelect('inv.location', 'location')
      .where('inv.cantidad_actual < inv.stock_minimo')
      .andWhere('inv.stock_minimo > 0')
      .andWhere('article.is_active = true')
      .orderBy('inv.cantidad_actual', 'ASC')
      .getMany();

    const alerts = belowMin.map((inv) => {
      let severity: 'CRITICO' | 'ALTO' | 'MEDIO';

      if (inv.cantidad_actual === 0) {
        severity = 'CRITICO';
      } else if (inv.cantidad_actual <= inv.stock_minimo * 0.5) {
        severity = 'ALTO';
      } else {
        severity = 'MEDIO';
      }

      return {
        inventoryId: inv.id_inventario,
        article: {
          id: inv.article.id_articulo,
          code: inv.article.codigo,
          name: inv.article.nombre,
        },
        location: {
          id: inv.location.id_ubicacion,
          code: inv.location.codigo_ubicacion,
          name: inv.location.nombre,
        },
        stockActual: inv.cantidad_actual,
        stockMinimo: inv.stock_minimo,
        stockMaximo: inv.stock_maximo,
        deficit: inv.stock_minimo - inv.cantidad_actual,
        severity,
      };
    });

    // Ordenar: CRITICO → ALTO → MEDIO
    const severityOrder: Record<string, number> = {
      CRITICO: 0,
      ALTO: 1,
      MEDIO: 2,
    };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
  }

  // ─── Órdenes ──────────────────────────────────────────────────────────────

  /**
   * Genera una orden manual. Devuelve la orden con su QR único.
   */
  async create(dto: CreateOrderDto) {
    const article = await this.articleRepository.findOne({
      where: { id_articulo: dto.articleId, is_active: true },
    });
    if (!article)
      throw new NotFoundException(`Artículo con ID ${dto.articleId} no encontrado.`);

    const origin = await this.locationRepository.findOne({
      where: { id_ubicacion: dto.originId },
    });
    if (!origin)
      throw new NotFoundException(`Ubicación de origen con ID ${dto.originId} no encontrada.`);

    const destination = await this.locationRepository.findOne({
      where: { id_ubicacion: dto.destinationId },
    });
    if (!destination)
      throw new NotFoundException(`Ubicación de destino con ID ${dto.destinationId} no encontrada.`);

    const qrCode = `ORD-${randomUUID().toUpperCase()}`;

    const order = this.orderRepository.create({
      qr_code: qrCode,
      cantidad: dto.quantity,
      estado: MovementStatus.PENDING,
      article,
      origin,
      destination,
      eta_days: null,
    });

    const saved = await this.orderRepository.save(order);

    return {
      ...saved,
      qrUrl: `/orders/${qrCode}`,
    };
  }

  /**
   * Lista todas las órdenes con sus relaciones.
   * Opcionalmente se puede filtrar por locationId para la Vista Almacén.
   */
  async findAll(locationId?: number) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.article', 'article')
      .leftJoinAndSelect('order.origin', 'origin')
      .leftJoinAndSelect('order.destination', 'destination')
      .orderBy('order.fecha_creacion', 'DESC');

    if (locationId) {
      qb.where(
        '(order.origin_id = :locId OR order.destination_id = :locId)',
        { locId: locationId },
      );
    }

    return qb.getMany();
  }

  /**
   * Obtiene el detalle de una orden a partir de su QR único.
   */
  async findByQrCode(qrCode: string) {
    const order = await this.orderRepository.findOne({
      where: { qr_code: qrCode },
      relations: ['article', 'origin', 'destination'],
    });

    if (!order) {
      throw new NotFoundException(`No se encontró ninguna orden con el QR: ${qrCode}`);
    }

    return order;
  }

  /**
   * Actualiza el estado logístico de una orden.
   * - Si el estado es APPROVED, se requiere `etaDays`.
   */
  async updateState(id: number, dto: UpdateOrderStateDto) {
    const order = await this.orderRepository.findOne({
      where: { id_orden: id },
      relations: ['article', 'origin', 'destination'],
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada.`);
    }

    // Bloquear actualizaciones sobre estados terminales
    if (order.estado === MovementStatus.CANCELLED) {
      throw new BadRequestException('No se puede actualizar una orden cancelada.');
    }
    if (order.estado === MovementStatus.COMPLETED) {
      throw new BadRequestException('No se puede actualizar una orden ya completada.');
    }

    // etaDays es obligatorio cuando se aprueba (equivalente a CONFIRMADO)
    if (dto.status === MovementStatus.APPROVED && dto.etaDays === undefined) {
      throw new BadRequestException(
        'El campo etaDays es obligatorio cuando el estado es APPROVED.',
      );
    }

    order.estado = dto.status;

    if (dto.status === MovementStatus.APPROVED && dto.etaDays !== undefined) {
      order.eta_days = dto.etaDays;
    }

    return this.orderRepository.save(order);
  }
}
