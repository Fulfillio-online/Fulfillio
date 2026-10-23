import { Module } from '@nestjs/common';
import { FulfillmentService } from './fulfillment.service';
import { FulfillmentController } from './fulfillment.controller';
import { FulfillmentRepository } from './fulfillment.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FulfillmentController],
  providers: [FulfillmentService, FulfillmentRepository],
  exports: [FulfillmentService],
})
export class FulfillmentModule {}
