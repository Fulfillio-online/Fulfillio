import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('jobs.webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ merchantId: string; event: string; payload: any; timestamp: number }>): Promise<any> {
    const { merchantId, event, payload, timestamp } = job.data;

    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant || !merchant.webhookUrl) {
      this.logger.debug(`No webhook URL configured for merchant ${merchantId}, skipping.`);
      return { skipped: true };
    }

    const bodyString = JSON.stringify({ event, payload, timestamp });
    const secret = merchant.webhookSecret || 'default_secret';
    const signature = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');

    this.logger.log(`Dispatching webhook '${event}' to ${merchant.webhookUrl} for merchant ${merchantId}`);

    try {
      const response = await fetch(merchant.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Fulfillio-Event': event,
          'X-Fulfillio-Signature': signature,
          'X-Fulfillio-Timestamp': String(timestamp),
        },
        body: bodyString,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Webhook endpoint responded with HTTP ${response.status}`);
      }

      this.logger.log(`Webhook '${event}' delivered successfully to ${merchant.webhookUrl}`);
      return { delivered: true, statusCode: response.status };
    } catch (err: any) {
      this.logger.error(`Failed to deliver webhook '${event}': ${err.message}`);
      throw err; // BullMQ will automatically retry with exponential backoff
    }
  }
}
