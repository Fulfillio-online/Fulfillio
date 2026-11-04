import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';

/**
 * QueueModule (apps/api)
 * Producer-only module: Enqueues jobs to Redis (jobs.pdf, jobs.webhooks, jobs.couriers).
 * All worker consumers are strictly isolated in `apps/worker` to protect API throughput.
 */
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
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
