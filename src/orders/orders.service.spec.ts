import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { Article } from '../articles/entities/article.entity';
import { Location } from '../locations/entities/location.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MovementStatus } from '../movements/enums/movement-status.enum';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockOrderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const mockArticleRepository = {
    findOne: jest.fn(),
  };
  const mockLocationRepository = {
    findOne: jest.fn(),
  };
  const mockInventoryRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepository,
        },
        {
          provide: getRepositoryToken(Location),
          useValue: mockLocationRepository,
        },
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockInventoryRepository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      articleId: 1,
      originId: 2,
      destinationId: 3,
      quantity: 10,
    };

    it('should throw NotFoundException if article is not found', async () => {
      mockArticleRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if origin location is not found', async () => {
      mockArticleRepository.findOne.mockResolvedValue({ id_articulo: 1, is_active: true });
      mockLocationRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if destination location is not found', async () => {
      mockArticleRepository.findOne.mockResolvedValue({ id_articulo: 1, is_active: true });
      mockLocationRepository.findOne.mockImplementation((opt: any) => {
        if (opt.where.id_ubicacion === dto.originId) {
          return { id_ubicacion: dto.originId };
        }
        return null;
      });

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      mockArticleRepository.findOne.mockResolvedValue({ id_articulo: 1, is_active: true });
      mockLocationRepository.findOne.mockImplementation((opt: any) => {
        return { id_ubicacion: opt.where.id_ubicacion };
      });
      mockInventoryRepository.findOne.mockResolvedValue({ cantidad_actual: 5 }); // Stock 5, requested 10

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'La ubicación de origen no cuenta con stock suficiente. Stock disponible: 5, solicitado: 10.',
      );
    });

    it('should throw BadRequestException if inventory record does not exist (stock is 0)', async () => {
      mockArticleRepository.findOne.mockResolvedValue({ id_articulo: 1, is_active: true });
      mockLocationRepository.findOne.mockImplementation((opt: any) => {
        return { id_ubicacion: opt.where.id_ubicacion };
      });
      mockInventoryRepository.findOne.mockResolvedValue(null); // Stock 0, requested 10

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'La ubicación de origen no cuenta con stock suficiente. Stock disponible: 0, solicitado: 10.',
      );
    });

    it('should successfully create an order if stock is sufficient', async () => {
      const article = { id_articulo: 1, is_active: true };
      const origin = { id_ubicacion: 2 };
      const destination = { id_ubicacion: 3 };

      mockArticleRepository.findOne.mockResolvedValue(article);
      mockLocationRepository.findOne.mockImplementation((opt: any) => {
        if (opt.where.id_ubicacion === 2) return origin;
        if (opt.where.id_ubicacion === 3) return destination;
        return null;
      });
      mockInventoryRepository.findOne.mockResolvedValue({ cantidad_actual: 15 }); // Stock 15, requested 10

      const orderInstance = {
        id_orden: 100,
        cantidad: 10,
        estado: MovementStatus.PENDING,
        article,
        origin,
        destination,
      };

      mockOrderRepository.create.mockReturnValue(orderInstance);
      mockOrderRepository.save.mockResolvedValue(orderInstance);

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.id_orden).toBe(100);
      expect(result.qrUrl).toBeDefined();
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
