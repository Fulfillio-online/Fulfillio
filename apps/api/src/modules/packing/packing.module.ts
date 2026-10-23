import { Module } from '@nestjs/common';
import { PackingService } from './packing.service';
import { PackingController } from './packing.controller';
import { MemoEngineModule } from '../memo-engine/memo-engine.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [MemoEngineModule, QueueModule],
  controllers: [PackingController],
  providers: [PackingService],
  exports: [PackingService],
})
export class PackingModule {}
