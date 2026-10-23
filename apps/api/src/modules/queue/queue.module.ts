import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { PdfProcessor } from './pdf.processor';
import { WebhookProcessor } from './webhook.processor';
import { MemoEngineModule } from '../memo-engine/memo-engine.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD', undefined),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'jobs.pdf' },
      { name: 'jobs.webhooks' },
      { name: 'jobs.couriers' },
    ),
    MemoEngineModule,
  ],
  providers: [QueueService, PdfProcessor, WebhookProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
