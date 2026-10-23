import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarehousesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLocation(data: {
    zone: string;
    aisle: string;
    rack: string;
    shelf: string;
    binCode: string;
  }) {
    return this.prisma.inventoryLocation.create({
      data: {
        zone: data.zone,
        aisle: data.aisle,
        rack: data.rack,
        shelf: data.shelf,
        binCode: data.binCode.toUpperCase(),
      },
    });
  }

  async findAllLocations() {
    return this.prisma.inventoryLocation.findMany({
      orderBy: { binCode: 'asc' },
    });
  }

  async findLocationByBin(binCode: string) {
    return this.prisma.inventoryLocation.findUnique({
      where: { binCode: binCode.toUpperCase() },
    });
  }
}
