import { Module } from '@nestjs/common';
import { MemoEngineService } from './memo-engine.service';
import { MemoEngineController } from './memo-engine.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MemoEngineController],
  providers: [MemoEngineService],
  exports: [MemoEngineService],
})
export class MemoEngineModule {}
