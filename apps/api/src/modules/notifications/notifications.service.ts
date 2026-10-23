import { Injectable, Logger } from '@nestjs/common';

export type WebhookEvent =
  | 'order.created'
  | 'order.status_changed'
  | 'fulfillment.status_changed'
  | 'shipment.dispatched'
  | 'shipment.delivered'
  | 'return.initiated'
  | 'return.received';

export interface NotificationPayload {
  merchantId: string;
  event: WebhookEvent;
  data: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Dispatch a notification event. In production this enqueues to jobs.webhooks
   * via BullMQ so the caller returns immediately.
   */
  async dispatch(payload: NotificationPayload): Promise<void> {
    this.logger.log(
      `[Notify] merchant=${payload.merchantId} event=${payload.event}`,
    );
    // TODO: inject QueueService and enqueue to jobs.webhooks
    // await this.queueService.addWebhookJob(payload);
  }

  /**
   * Send an in-app notification (persisted in DB for dashboard bell icon).
   */
  async sendInApp(merchantId: string, title: string, message: string): Promise<void> {
    this.logger.log(`[InApp] merchant=${merchantId} title=${title}`);
    // TODO: persist to notifications table & push via SSE/WebSocket
  }
}
