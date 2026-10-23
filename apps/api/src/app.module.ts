import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

// Infrastructure
import { PrismaModule } from './prisma/prisma.module';

// Domain Modules
import { AuthModule } from './modules/auth/auth.module';
import { MerchantModule } from './modules/merchants/merchant.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderModule } from './modules/orders/order.module';
import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';
import { PackingModule } from './modules/packing/packing.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { MemoEngineModule } from './modules/memo-engine/memo-engine.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

// Queue Infrastructure (job producers only; processors live in apps/worker)
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,

    // Auth & Identity
    AuthModule,

    // Core Domain
    MerchantModule,
    WarehousesModule,
    InventoryModule,
    OrderModule,
    FulfillmentModule,
    PackingModule,
    ShippingModule,
    ReturnsModule,

    // Supporting Domains
    MemoEngineModule,
    IntegrationsModule,
    BillingModule,
    NotificationsModule,

    // Infrastructure
    QueueModule,
  ],
})
export class AppModule {}
