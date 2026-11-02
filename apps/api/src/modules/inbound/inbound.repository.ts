import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InboundShipmentStatus, StockMovementReason } from '@fulfillio/contracts';

@Injectable()
export class InboundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAsn(
    merchantId: string,
    asnCode: string,
    data: {
      carrierName: string;
      trackingReference?: string;
      expectedArrivalDate: Date;
      notes?: string;
      items: Array<{ variantId: string; expectedQuantity: number; assignedBinCode?: string }>;
    },
  ) {
    return this.prisma.inboundShipment.create({
      data: {
        merchantId,
        asnCode,
        status: InboundShipmentStatus.IN_TRANSIT,
        carrierName: data.carrierName,
        trackingReference: data.trackingReference,
        expectedArrivalDate: data.expectedArrivalDate,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            variantId: item.variantId,
            expectedQuantity: item.expectedQuantity,
            assignedBinCode: item.assignedBinCode || 'A-01-01',
          })),
        },
      },
      include: {
        items: {
          include: {
            variant: { select: { sku: true, title: true, barcode: true } },
          },
        },
        merchant: { select: { merchantCode: true, businessName: true } },
      },
    });
  }

  async findByMerchant(merchantId: string) {
    return this.prisma.inboundShipment.findMany({
      where: { merchantId },
      include: {
        items: {
          include: {
            variant: { select: { sku: true, title: true, barcode: true } },
          },
        },
        merchant: { select: { merchantCode: true, businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForWarehouse() {
    return this.prisma.inboundShipment.findMany({
      include: {
        items: {
          include: {
            variant: { select: { sku: true, title: true, barcode: true } },
          },
        },
        merchant: { select: { merchantCode: true, businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.inboundShipment.findUnique({
      where: { id },
      include: {
        items: true,
        merchant: true,
      },
    });
  }

  /**
   * Atomically receive inbound stock at warehouse dock:
   * - Updates receivedGoodQuantity & receivedDamagedQuantity on ASN items
   * - Increments quantityAvailable & quantityDamaged in InventoryItem
   * - Creates auditable InventoryAuditLog records
   */
  async receiveAndPutawayShipment(
    shipmentId: string,
    merchantId: string,
    workerId: string,
    receivedItems: Array<{
      variantId: string;
      receivedGoodQuantity: number;
      receivedDamagedQuantity: number;
      assignedBinCode?: string;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of receivedItems) {
        const binCode = (item.assignedBinCode || 'A-01-01').toUpperCase();

        const location = await tx.inventoryLocation.upsert({
          where: { binCode },
          update: {},
          create: {
            zone: binCode.split('-')[0] || 'A',
            aisle: binCode.split('-')[1] || '01',
            rack: binCode.split('-')[2] || '01',
            shelf: '01',
            binCode,
          },
        });

        await tx.inboundShipmentItem.updateMany({
          where: {
            inboundShipmentId: shipmentId,
            variantId: item.variantId,
          },
          data: {
            receivedGoodQuantity: item.receivedGoodQuantity,
            receivedDamagedQuantity: item.receivedDamagedQuantity,
            assignedBinCode: binCode,
          },
        });

        await tx.inventoryItem.upsert({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: location.id,
            },
          },
          update: {
            quantityAvailable: { increment: item.receivedGoodQuantity },
            quantityDamaged: { increment: item.receivedDamagedQuantity },
          },
          create: {
            variantId: item.variantId,
            locationId: location.id,
            quantityAvailable: item.receivedGoodQuantity,
            quantityDamaged: item.receivedDamagedQuantity,
            quantityReserved: 0,
          },
        });

        if (item.receivedGoodQuantity > 0) {
          await tx.inventoryAuditLog.create({
            data: {
              merchantId,
              variantId: item.variantId,
              quantityDelta: item.receivedGoodQuantity,
              reason: StockMovementReason.INBOUND_ASN,
              referenceId: shipmentId,
              performedByUserId: workerId,
              notes: `Inbound ASN received & putaway to bin ${binCode}`,
            },
          });
        }

        if (item.receivedDamagedQuantity > 0) {
          await tx.inventoryAuditLog.create({
            data: {
              merchantId,
              variantId: item.variantId,
              quantityDelta: item.receivedDamagedQuantity,
              reason: StockMovementReason.DAMAGED_QUARANTINE,
              referenceId: shipmentId,
              performedByUserId: workerId,
              notes: `Inbound ASN damaged units routed to quarantine`,
            },
          });
        }
      }

      return tx.inboundShipment.update({
        where: { id: shipmentId },
        data: {
          status: InboundShipmentStatus.COMPLETED,
          receivedAt: new Date(),
          receivedByWorkerId: workerId,
        },
        include: {
          items: {
            include: {
              variant: { select: { sku: true, title: true } },
            },
          },
        },
      });
    });
  }
}
