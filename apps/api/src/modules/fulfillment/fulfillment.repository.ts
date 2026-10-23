import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FulfillmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderId(merchantId: string, orderId: string) {
    return this.prisma.fulfillment.findFirst({
      where: { merchantId, orderId },
      include: { order: true },
    });
  }

  async findAll(merchantId: string, filters?: { status?: string }) {
    return this.prisma.fulfillment.findMany({
      where: { merchantId, ...(filters?.status ? { status: filters.status as any } : {}) },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    merchantId: string;
    orderId: string;
    warehouseId: string;
    assignedTo?: string;
  }) {
    return this.prisma.fulfillment.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });
  }

  async updateStatus(merchantId: string, fulfillmentId: string, status: string) {
    return this.prisma.fulfillment.updateMany({
      where: { id: fulfillmentId, merchantId },
      data: { status: status as any, updatedAt: new Date() },
    });
  }
}
