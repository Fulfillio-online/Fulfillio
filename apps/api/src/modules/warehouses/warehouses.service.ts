import { Injectable, ConflictException } from '@nestjs/common';
import { WarehousesRepository } from './warehouses.repository';

@Injectable()
export class WarehousesService {
  constructor(private readonly repository: WarehousesRepository) {}

  async addBinLocation(dto: {
    zone: string;
    aisle: string;
    rack: string;
    shelf: string;
    binCode: string;
  }) {
    const existing = await this.repository.findLocationByBin(dto.binCode);
    if (existing) {
      throw new ConflictException(`Bin code '${dto.binCode}' already exists in warehouse.`);
    }
    return this.repository.createLocation(dto);
  }

  async getAllLocations() {
    return this.repository.findAllLocations();
  }
}
