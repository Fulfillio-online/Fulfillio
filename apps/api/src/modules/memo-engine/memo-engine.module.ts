import { Module } from '@nestjs/common';
import { MemoEngineController } from './memo-engine.controller';
import { MemoEngineService } from './memo-engine.service';
import { MemoEngineRepository } from './memo-engine.repository';

@Module({
  controllers: [MemoEngineController],
  providers: [MemoEngineService, MemoEngineRepository],
  exports: [MemoEngineService, MemoEngineRepository],
})
export class MemoEngineModule {}
