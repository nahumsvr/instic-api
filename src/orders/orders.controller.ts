import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStateDto } from './dto/update-order-state.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── GET /alerts ─────────────────────────────────────────────────────────

  @Get('alerts')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  getAlerts() {
    return this.ordersService.getAlerts();
  }

  // ─── POST /orders ─────────────────────────────────────────────────────────

  @Post('orders')
  @Roles(Role.ADMIN, Role.MANAGER)
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  // ─── GET /orders ──────────────────────────────────────────────────────────

  @Get('orders')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  findAll(@Query('locationId') locationId?: string) {
    const locId = locationId ? parseInt(locationId, 10) : undefined;
    return this.ordersService.findAll(locId);
  }

  // ─── GET /orders/:qrCode ──────────────────────────────────────────────────

  @Get('orders/:qrCode')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  findByQrCode(@Param('qrCode') qrCode: string) {
    return this.ordersService.findByQrCode(qrCode);
  }

  // ─── PATCH /orders/:id/state ──────────────────────────────────────────────

  @Patch('orders/:id/state')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  updateState(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStateDto,
  ) {
    return this.ordersService.updateState(id, dto);
  }
}
