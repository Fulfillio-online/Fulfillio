import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('warehouses')
@UseGuards(JwtAuthGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post('locations')
  async createLocation(
    @Body()
    body: {
      zone: string;
      aisle: string;
      rack: string;
      shelf: string;
      binCode: string;
    },
  ) {
    return this.warehousesService.addBinLocation(body);
  }

  @Get('locations')
  async getLocations() {
    return this.warehousesService.getAllLocations();
  }
}
