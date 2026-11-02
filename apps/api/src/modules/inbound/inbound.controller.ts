import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { InboundService } from './inbound.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@fulfillio/contracts';

@Controller('inbound')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InboundController {
  constructor(private readonly inboundService: InboundService) {}

  /**
   * Merchant creates an Inbound Stock Shipment (ASN) before sending goods to warehouse
   */
  @Post()
  @Roles(UserRole.MERCHANT, UserRole.SUPER_ADMIN)
  async createAsn(
    @Request() req: any,
    @Body()
    body: {
      carrierName: string;
      trackingReference?: string;
      expectedArrivalDate: string;
      notes?: string;
      items: Array<{ variantId: string; expectedQuantity: number; assignedBinCode?: string }>;
    },
  ) {
    return this.inboundService.createInboundAsn(req.user.merchantId, body);
  }

  /**
   * List Inbound Shipments (Merchants see their own; Workers & Admins see all dock arrivals)
   */
  @Get()
  async listShipments(@Request() req: any) {
    const isStaff =
      req.user.role === UserRole.SUPER_ADMIN || req.user.role === UserRole.WAREHOUSE_OPERATOR;
    return this.inboundService.listInboundShipments(req.user.merchantId, isStaff);
  }

  /**
   * Warehouse Operator verifies physical stock count, separates damaged units, and puts away into shelf bins
   */
  @Post(':id/receive')
  @Roles(UserRole.WAREHOUSE_OPERATOR, UserRole.SUPER_ADMIN)
  async receiveShipment(
    @Param('id') shipmentId: string,
    @Request() req: any,
    @Body()
    body: {
      items: Array<{
        variantId: string;
        receivedGoodQuantity: number;
        receivedDamagedQuantity: number;
        assignedBinCode?: string;
      }>;
    },
  ) {
    return this.inboundService.confirmWarehouseReceipt(shipmentId, req.user.sub, body.items);
  }
}
