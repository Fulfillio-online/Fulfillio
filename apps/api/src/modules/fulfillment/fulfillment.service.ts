import { Injectable, NotFoundException } from '@nestjs/common';
import { FulfillmentRepository } from './fulfillment.repository';

export type FulfillmentStatus = 'PENDING' | 'PICKING' | 'PACKING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

const VALID_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  PENDING:   ['PICKING', 'CANCELLED'],
  PICKING:   ['PACKING', 'CANCELLED'],
  PACKING:   ['SHIPPED', 'CANCELLED'],
  SHIPPED:   ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class FulfillmentService {
  constructor(private readonly fulfillmentRepo: FulfillmentRepository) {}

  async getAll(merchantId: string, status?: string) {
    return this.fulfillmentRepo.findAll(merchantId, { status });
  }

  async getByOrder(merchantId: string, orderId: string) {
    const fulfillment = await this.fulfillmentRepo.findByOrderId(merchantId, orderId);
    if (!fulfillment) throw new NotFoundException(`No fulfillment record for order ${orderId}`);
    return fulfillment;
  }

  async initiate(merchantId: string, body: { orderId: string; warehouseId: string; assignedTo?: string }) {
    return this.fulfillmentRepo.create({ merchantId, ...body });
  }

  async transition(merchantId: string, fulfillmentId: string, toStatus: FulfillmentStatus) {
    const fulfillments = await this.fulfillmentRepo.findAll(merchantId, {});
    const record = fulfillments.find((f) => f.id === fulfillmentId);
    if (!record) throw new NotFoundException('Fulfillment not found');

    const currentStatus = record.status as FulfillmentStatus;
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} → ${toStatus}`);
    }

    await this.fulfillmentRepo.updateStatus(merchantId, fulfillmentId, toStatus);
    return { fulfillmentId, from: currentStatus, to: toStatus };
  }
}
