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
    return this.pdfQueue.add(
      'render-invoice',
      { orderId, memoCode },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }

  /**
   * Enqueue merchant webhook delivery with retry
   */
  async enqueueWebhook(merchantId: string, event: string, payload: Record<string, any>) {
    return this.webhookQueue.add(
      'dispatch-webhook',
      { merchantId, event, payload, timestamp: Date.now() },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    );
  }

  /**
   * Enqueue courier booking job
   */
  async enqueueCourierBooking(orderId: string, provider: string) {
    return this.courierQueue.add(
      'book-consignment',
      { orderId, provider },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }
}
