import { Module } from '@nestjs/common';
import { InboundController } from './inbound.controller';
import { InboundService } from './inbound.service';
import { InboundRepository } from './inbound.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InboundController],
  providers: [InboundService, InboundRepository],
  exports: [InboundService],
})
export class InboundModule {}
