import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { ShippingRepository } from './shipping.repository';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { InventoryModule } from '../inventory/inventory.module';
import { SteadfastAdapter } from './adapters/steadfast.adapter';
import { PathaoAdapter } from './adapters/pathao.adapter';
import { RedxAdapter } from './adapters/redx.adapter';
import { CourierAdapterRegistry } from './adapters/courier-adapter.registry';

@Module({
  imports: [AuthModule, BillingModule, InventoryModule],
  controllers: [ShippingController],
  providers: [
    ShippingService,
    ShippingRepository,
    SteadfastAdapter,
    PathaoAdapter,
    RedxAdapter,
    CourierAdapterRegistry,
  ],
  exports: [ShippingService, ShippingRepository, CourierAdapterRegistry],
})
export class ShippingModule {}
