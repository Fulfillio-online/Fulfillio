import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { ShippingRepository } from './shipping.repository';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [AuthModule, BillingModule],
  controllers: [ShippingController],
  providers: [ShippingService, ShippingRepository],
  exports: [ShippingService, ShippingRepository],
})
export class ShippingModule {}
