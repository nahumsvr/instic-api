import { Controller, Get, Post, Body, Patch, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateStorageCostDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Get()
  findAll() {
    return this.locationsService.findAll();
  }

  @Get(':id/inventory')
  getInventory(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.getInventory(id);
  }

  @Patch(':id/storage-cost')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateStorageCost(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStorageCostDto: UpdateStorageCostDto,
  ) {
    return this.locationsService.updateStorageCost(id, updateStorageCostDto);
  }
}
