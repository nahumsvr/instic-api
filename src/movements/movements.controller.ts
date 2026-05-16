import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { MovementInputDto } from './dto/movement-input.dto';
import { MovementOutputDto } from './dto/movement-output.dto';
import { MovementTransferDto } from './dto/movement-transfer.dto';
import { QueryMovementDto } from './dto/query-movement.dto';
import { CancelMovementDto } from './dto/cancel-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Controller('movements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post('input')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  registerInput(@Body() dto: MovementInputDto) {
    return this.movementsService.registerInput(dto);
  }

  @Post('output')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  registerOutput(@Body() dto: MovementOutputDto) {
    return this.movementsService.registerOutput(dto);
  }

  @Post('transfer')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  registerTransfer(@Body() dto: MovementTransferDto) {
    return this.movementsService.registerTransfer(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  findAll(@Query() query: QueryMovementDto) {
    return this.movementsService.findAll(query);
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN, Role.MANAGER) // Only Admin and Manager should cancel
  cancelMovement(@Param('id') id: string, @Body() dto: CancelMovementDto) {
    return this.movementsService.cancelMovement(+id, dto);
  }
}
