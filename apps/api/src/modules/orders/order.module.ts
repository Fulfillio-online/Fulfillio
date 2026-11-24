import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { InventoryModule } from '../inventory/inventory.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [InventoryModule, AuthModule, BillingModule],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
