import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Movement } from './entities/movement.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Location } from '../locations/entities/location.entity';
import { Article } from '../articles/entities/article.entity';
import { MovementInputDto } from './dto/movement-input.dto';
import { MovementOutputDto } from './dto/movement-output.dto';
import { MovementTransferDto } from './dto/movement-transfer.dto';
import { QueryMovementDto } from './dto/query-movement.dto';
import { CancelMovementDto } from './dto/cancel-movement.dto';
import { UpdateMovementStatusDto } from './dto/update-movement-status.dto';
import { MovementType } from './enums/movement-type.enum';
import { MovementStatus } from './enums/movement-status.enum';

@Injectable()
export class MovementsService {
  constructor(private readonly dataSource: DataSource) {}

  async registerInput(dto: MovementInputDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const article = await queryRunner.manager.findOne(Article, { where: { id_articulo: dto.articleId } });
      if (!article) throw new NotFoundException('Article not found');

      const destination = await queryRunner.manager.findOne(Location, { where: { id_ubicacion: dto.destinationId } });
      if (!destination) throw new NotFoundException('Destination location not found');

      let origin: Location | null = null;
      if (dto.originId) {
        origin = await queryRunner.manager.findOne(Location, { where: { id_ubicacion: dto.originId } });
        if (!origin) throw new NotFoundException('Origin location not found');
      }

      const status = dto.status || MovementStatus.COMPLETED;

      if (status === MovementStatus.COMPLETED) {
        let inventory = await queryRunner.manager.findOne(Inventory, {
          where: { location: { id_ubicacion: dto.destinationId }, article: { id_articulo: dto.articleId } },
        });

        if (inventory) {
          inventory.cantidad_actual += dto.quantity;
          await queryRunner.manager.save(inventory);
        } else {
          inventory = queryRunner.manager.create(Inventory, {
            location: destination,
            article: article,
            cantidad_actual: dto.quantity,
          });
          await queryRunner.manager.save(inventory);
        }
      }

      const movement = queryRunner.manager.create(Movement, {
        tipo: MovementType.INPUT,
        cantidad: dto.quantity,
        article: article,
        originLocation: origin,
        destinationLocation: destination,
        estado: status,
      });

      const savedMovement = await queryRunner.manager.save(movement);
      await queryRunner.commitTransaction();
      return savedMovement;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async registerOutput(dto: MovementOutputDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const article = await queryRunner.manager.findOne(Article, { where: { id_articulo: dto.articleId } });
      if (!article) throw new NotFoundException('Article not found');

      const origin = await queryRunner.manager.findOne(Location, { where: { id_ubicacion: dto.originId } });
      if (!origin) throw new NotFoundException('Origin location not found');

      let destination: Location | null = null;
      if (dto.destinationId) {
        destination = await queryRunner.manager.findOne(Location, { where: { id_ubicacion: dto.destinationId } });
        if (!destination) throw new NotFoundException('Destination location not found');
      }

      const status = dto.status || MovementStatus.COMPLETED;

      if (status === MovementStatus.COMPLETED) {
        const inventory = await queryRunner.manager.findOne(Inventory, {
          where: { location: { id_ubicacion: dto.originId }, article: { id_articulo: dto.articleId } },
        });

        if (!inventory || inventory.cantidad_actual < dto.quantity) {
          throw new ConflictException('Insufficient stock for output');
        }

        inventory.cantidad_actual -= dto.quantity;
        await queryRunner.manager.save(inventory);
      }

      const movement = queryRunner.manager.create(Movement, {
        tipo: MovementType.OUTPUT,
        cantidad: dto.quantity,
        article: article,
        originLocation: origin,
        destinationLocation: destination,
        estado: status,
      });

      const savedMovement = await queryRunner.manager.save(movement);
      await queryRunner.commitTransaction();
      return savedMovement;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async registerTransfer(dto: MovementTransferDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const article = await queryRunner.manager.findOne(Article, { where: { id_articulo: dto.articleId } });
      if (!article) throw new NotFoundException('Article not found');

      const origin = await queryRunner.manager.findOne(Location, { where: { id_ubicacion: dto.originId } });
      if (!origin) throw new NotFoundException('Origin location not found');

      const destination = await queryRunner.manager.findOne(Location, { where: { id_ubicacion: dto.destinationId } });
      if (!destination) throw new NotFoundException('Destination location not found');

      if (origin.id_ubicacion === destination.id_ubicacion) {
        throw new BadRequestException('Origin and destination cannot be the same');
      }

      const status = dto.status || MovementStatus.COMPLETED;

      if (status === MovementStatus.COMPLETED) {
        const originInventory = await queryRunner.manager.findOne(Inventory, {
          where: { location: { id_ubicacion: dto.originId }, article: { id_articulo: dto.articleId } },
        });

        if (!originInventory || originInventory.cantidad_actual < dto.quantity) {
          throw new ConflictException('Insufficient stock in origin location for transfer');
        }

        originInventory.cantidad_actual -= dto.quantity;
        await queryRunner.manager.save(originInventory);

        let destInventory = await queryRunner.manager.findOne(Inventory, {
          where: { location: { id_ubicacion: dto.destinationId }, article: { id_articulo: dto.articleId } },
        });

        if (destInventory) {
          destInventory.cantidad_actual += dto.quantity;
          await queryRunner.manager.save(destInventory);
        } else {
          destInventory = queryRunner.manager.create(Inventory, {
            location: destination,
            article: article,
            cantidad_actual: dto.quantity,
          });
          await queryRunner.manager.save(destInventory);
        }
      }

      const movement = queryRunner.manager.create(Movement, {
        tipo: MovementType.TRANSFER,
        cantidad: dto.quantity,
        article: article,
        originLocation: origin,
        destinationLocation: destination,
        estado: status,
      });

      const savedMovement = await queryRunner.manager.save(movement);
      await queryRunner.commitTransaction();
      return savedMovement;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: number, dto: UpdateMovementStatusDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const movement = await queryRunner.manager.findOne(Movement, {
        where: { id_movimiento: id },
        relations: ['article', 'originLocation', 'destinationLocation'],
      });

      if (!movement) throw new NotFoundException('Movement not found');
      
      if (movement.estado === MovementStatus.CANCELLED) {
        throw new ConflictException('Cannot change status of a cancelled movement');
      }
      
      if (movement.estado === MovementStatus.COMPLETED) {
        throw new ConflictException('Cannot change status of an already completed movement');
      }

      // If we are transitioning TO COMPLETED, we must apply the inventory changes
      if (dto.status === MovementStatus.COMPLETED) {
        if (movement.tipo === MovementType.INPUT) {
          if (!movement.destinationLocation) throw new ConflictException('Destination location is missing');
          let inventory = await queryRunner.manager.findOne(Inventory, {
            where: { location: { id_ubicacion: movement.destinationLocation.id_ubicacion }, article: { id_articulo: movement.article.id_articulo } },
          });

          if (inventory) {
            inventory.cantidad_actual += movement.cantidad;
            await queryRunner.manager.save(inventory);
          } else {
            inventory = queryRunner.manager.create(Inventory, {
              location: movement.destinationLocation,
              article: movement.article,
              cantidad_actual: movement.cantidad,
            });
            await queryRunner.manager.save(inventory);
          }
        } else if (movement.tipo === MovementType.OUTPUT) {
          if (!movement.originLocation) throw new ConflictException('Origin location is missing');
          const inventory = await queryRunner.manager.findOne(Inventory, {
            where: { location: { id_ubicacion: movement.originLocation.id_ubicacion }, article: { id_articulo: movement.article.id_articulo } },
          });

          if (!inventory || inventory.cantidad_actual < movement.cantidad) {
            throw new ConflictException('Insufficient stock for output completion');
          }

          inventory.cantidad_actual -= movement.cantidad;
          await queryRunner.manager.save(inventory);
        } else if (movement.tipo === MovementType.TRANSFER) {
          if (!movement.originLocation || !movement.destinationLocation) throw new ConflictException('Origin or destination is missing');
          
          const originInventory = await queryRunner.manager.findOne(Inventory, {
            where: { location: { id_ubicacion: movement.originLocation.id_ubicacion }, article: { id_articulo: movement.article.id_articulo } },
          });

          if (!originInventory || originInventory.cantidad_actual < movement.cantidad) {
            throw new ConflictException('Insufficient stock in origin location for transfer completion');
          }

          originInventory.cantidad_actual -= movement.cantidad;
          await queryRunner.manager.save(originInventory);

          let destInventory = await queryRunner.manager.findOne(Inventory, {
            where: { location: { id_ubicacion: movement.destinationLocation.id_ubicacion }, article: { id_articulo: movement.article.id_articulo } },
          });

          if (destInventory) {
            destInventory.cantidad_actual += movement.cantidad;
            await queryRunner.manager.save(destInventory);
          } else {
            destInventory = queryRunner.manager.create(Inventory, {
              location: movement.destinationLocation,
              article: movement.article,
              cantidad_actual: movement.cantidad,
            });
            await queryRunner.manager.save(destInventory);
          }
        }
      }

      movement.estado = dto.status;
      const updatedMovement = await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();
      return updatedMovement;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: QueryMovementDto) {
    const qb = this.dataSource.getRepository(Movement).createQueryBuilder('movement')
      .leftJoinAndSelect('movement.article', 'article')
      .leftJoinAndSelect('movement.originLocation', 'origin')
      .leftJoinAndSelect('movement.destinationLocation', 'destination');

    if (query.type) {
      qb.andWhere('movement.tipo = :type', { type: query.type });
    }

    if (query.status) {
      qb.andWhere('movement.estado = :status', { status: query.status });
    }

    if (query.locationId) {
      qb.andWhere('(movement.origin_location_id = :locId OR movement.destination_location_id = :locId)', { locId: query.locationId });
    }

    qb.orderBy('movement.fecha_movimiento', 'DESC');
    return qb.getMany();
  }

  async cancelMovement(id: number, dto: CancelMovementDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const movement = await queryRunner.manager.findOne(Movement, {
        where: { id_movimiento: id },
        relations: ['article', 'originLocation', 'destinationLocation'],
      });

      if (!movement) throw new NotFoundException('Movement not found');
      if (movement.estado === MovementStatus.CANCELLED) throw new ConflictException('Movement is already cancelled');

      // If the movement was never completed, we don't need to revert inventory
      if (movement.estado === MovementStatus.COMPLETED) {
        // Revert the operation based on type
        if (movement.tipo === MovementType.INPUT) {
          if (!movement.destinationLocation) throw new ConflictException('Destination location is missing');
          const inventory = await queryRunner.manager.findOne(Inventory, {
            where: { location: { id_ubicacion: movement.destinationLocation.id_ubicacion }, article: { id_articulo: movement.article.id_articulo } },
          });
          if (!inventory || inventory.cantidad_actual < movement.cantidad) {
            throw new ConflictException('Cannot cancel INPUT: Destination location would have negative stock');
          }
          inventory.cantidad_actual -= movement.cantidad;
          await queryRunner.manager.save(inventory);
        } else if (movement.tipo === MovementType.OUTPUT) {
          if (!movement.originLocation) throw new ConflictException('Origin location is missing');
          let inventory = await queryRunner.manager.findOne(Inventory, {
            where: { location: { id_ubicacion: movement.originLocation.id_ubicacion }, article: { id_articulo: movement.article.id_articulo } },
          });
          if (inventory) {
            inventory.cantidad_actual += movement.cantidad;
          } else {
            inventory = queryRunner.manager.create(Inventory, {
              location: movement.originLocation,
              article: movement.article,
              cantidad_actual: movement.cantidad,
            });
          }
          await queryRunner.manager.save(inventory);
        } else if (movement.tipo === MovementType.TRANSFER) {
          if (!movement.originLocation || !movement.destinationLocation) throw new ConflictException('Origin or destination is missing');
          // Revert origin: add back
          let originInventory = await queryRunner.manager.findOne(Inventory, {
            where: { location: { id_ubicacion: movement.originLocation.id_ubicacion }, article: { id_articulo: movement.article.id_articulo } },
          });
          if (originInventory) {
            originInventory.cantidad_actual += movement.cantidad;
          } else {
            originInventory = queryRunner.manager.create(Inventory, {
              location: movement.originLocation,
              article: movement.article,
              cantidad_actual: movement.cantidad,
            });
          }
          await queryRunner.manager.save(originInventory);

          // Revert destination: remove
          const destInventory = await queryRunner.manager.findOne(Inventory, {
            where: { location: { id_ubicacion: movement.destinationLocation.id_ubicacion }, article: { id_articulo: movement.article.id_articulo } },
          });
          if (!destInventory || destInventory.cantidad_actual < movement.cantidad) {
            throw new ConflictException('Cannot cancel TRANSFER: Destination location would have negative stock');
          }
          destInventory.cantidad_actual -= movement.cantidad;
          await queryRunner.manager.save(destInventory);
        }
      }

      movement.estado = MovementStatus.CANCELLED;
      movement.motivo_anulacion = dto.cancelReason;
      const updatedMovement = await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();
      return updatedMovement;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
