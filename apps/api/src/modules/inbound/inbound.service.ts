import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InboundRepository } from './inbound.repository';
import { InboundShipmentStatus } from '@fulfillio/contracts';

@Injectable()
export class InboundService {
  constructor(private readonly repository: InboundRepository) {}

  async createInboundAsn(
    merchantId: string,
    payload: {
      carrierName: string;
      trackingReference?: string;
      expectedArrivalDate: string;
      notes?: string;
      items: Array<{ variantId: string; expectedQuantity: number; assignedBinCode?: string }>;
    },
  ) {
    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('Inbound shipment must include at least one SKU variant.');
    }

    const asnCode = `ASN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.repository.createAsn(merchantId, asnCode, {
      carrierName: payload.carrierName,
      trackingReference: payload.trackingReference,
      expectedArrivalDate: new Date(payload.expectedArrivalDate || Date.now()),
      notes: payload.notes,
      items: payload.items,
    });
  }

  async listInboundShipments(merchantId?: string, isWarehouseStaff = false) {
    if (isWarehouseStaff || !merchantId) {
      return this.repository.findAllForWarehouse();
    }
    return this.repository.findByMerchant(merchantId);
  }

  async confirmWarehouseReceipt(
    shipmentId: string,
    workerId: string,
    items: Array<{
      variantId: string;
      receivedGoodQuantity: number;
      receivedDamagedQuantity: number;
      assignedBinCode?: string;
    }>,
  ) {
    const shipment = await this.repository.findById(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Inbound shipment '${shipmentId}' not found.`);
    }

    if (shipment.status === InboundShipmentStatus.COMPLETED) {
      throw new BadRequestException('This Inbound ASN has already been received and put away.');
    }

    return this.repository.receiveAndPutawayShipment(
      shipmentId,
      shipment.merchantId,
      workerId,
      items,
    );
  }
}
