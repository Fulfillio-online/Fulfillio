import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { ShippingRepository } from './shipping.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ShippingController],
  providers: [ShippingService, ShippingRepository],
  exports: [ShippingService, ShippingRepository],
})
export class ShippingModule {}
