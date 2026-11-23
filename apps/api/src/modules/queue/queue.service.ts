import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('jobs.pdf') private readonly pdfQueue: Queue,
    @InjectQueue('jobs.webhooks') private readonly webhookQueue: Queue,
    @InjectQueue('jobs.couriers') private readonly courierQueue: Queue,
  ) {}

  /**
   * Enqueue asynchronous PDF invoice rendering job
   */
  async enqueuePdfGeneration(orderId: string, memoCode: string) {
    try {
      return await this.pdfQueue.add(
        'render-invoice',
        { orderId, memoCode },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      );
    } catch (err: any) {
      console.warn('[QueueService] Redis offline, skipping PDF queue job:', err?.message || err);
      return null;
    }
  }

  /**
   * Enqueue merchant webhook delivery with retry
   */
  async enqueueWebhook(merchantId: string, event: string, payload: Record<string, any>) {
    try {
      return await this.webhookQueue.add(
        'dispatch-webhook',
        { merchantId, event, payload, timestamp: Date.now() },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: 100,
          removeOnFail: 1000,
        },
      );
    } catch (err: any) {
      console.warn('[QueueService] Redis offline, skipping webhook queue job:', err?.message || err);
      return null;
    }
  }

  /**
   * Enqueue courier booking job
   */
  async enqueueCourierBooking(orderId: string, provider: string) {
    try {
      return await this.courierQueue.add(
        'book-consignment',
        { orderId, provider },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    } catch (err: any) {
      console.warn('[QueueService] Redis offline, skipping courier queue job:', err?.message || err);
      return null;
    }
  }
}
