import { Job } from 'bullmq';
import * as crypto from 'crypto';
import { getPrismaClient } from '../db/prisma.client';

export interface WebhookJobData {
  merchantId: string;
  event: string;
  payload: Record<string, any>;
  timestamp: number;
}

export async function processWebhookJob(job: Job<WebhookJobData>) {
  const { merchantId, event, payload, timestamp } = job.data;
  const prisma = getPrismaClient();

  console.log(
    `[Worker - Webhook] Dispatching event '${event}' for merchant ${merchantId} (Attempt: ${job.attemptsMade + 1}/${job.opts.attempts || 5})`,
  );

  // 1. Fetch Merchant
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant || !merchant.webhookUrl) {
    console.log(`[Worker - Webhook] Merchant ${merchantId} has no webhook URL configured. Skipping.`);
    return { skipped: true, reason: 'No webhook URL configured' };
  }

  // 2. Prepare payload & HMAC signature
  const bodyString = JSON.stringify({
    event,
    payload,
    timestamp: timestamp || Date.now(),
  });

  const secret = merchant.webhookSecret || 'default_fulfillio_secret';
  const signature = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');

  // 3. Dispatch HTTP POST
  let statusCode = 0;
  let responseText = '';
  const endpointUrl = merchant.webhookUrl;

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Fulfillio-Event': event,
        'X-Fulfillio-Signature': signature,
        'X-Fulfillio-Timestamp': String(timestamp || Date.now()),
        'User-Agent': 'Fulfillio-Webhook-Worker/1.0',
      },
      body: bodyString,
      signal: AbortSignal.timeout(10000),
    });

    statusCode = response.status;
    responseText = (await response.text()).slice(0, 1000);

    if (!response.ok) {
      throw new Error(`Endpoint returned HTTP status ${statusCode}: ${responseText}`);
    }

    // 4. Log Success in WebhookDeliveryLog
    await prisma.webhookDeliveryLog.create({
      data: {
        merchantId,
        event,
        payload: payload as any,
        endpointUrl,
        attempts: job.attemptsMade + 1,
        statusCode,
        responseBody: responseText,
        isSuccess: true,
      },
    });

    console.log(`[Worker - Webhook] Successfully delivered '${event}' to ${endpointUrl}`);
    return {
      success: true,
      deliveredAt: new Date().toISOString(),
      statusCode,
    };
  } catch (err: any) {
    console.error(`[Worker - Webhook] Failed delivery to ${endpointUrl} on attempt ${job.attemptsMade + 1}: ${err.message}`);

    const nextDelayMs = Math.pow(2, job.attemptsMade) * 3000;
    const nextRetryAt = new Date(Date.now() + nextDelayMs);

    // Record failure attempt in Database
    try {
      await prisma.webhookDeliveryLog.create({
        data: {
          merchantId,
          event,
          payload: payload as any,
          endpointUrl,
          attempts: job.attemptsMade + 1,
          statusCode: statusCode || 500,
          responseBody: responseText || null,
          isSuccess: false,
          failedReason: err.message,
          nextRetryAt,
        },
      });
    } catch (dbErr: any) {
      console.error(`[Worker - Webhook] Could not write failure log to DB: ${dbErr.message}`);
    }

    // Re-throw so BullMQ initiates backoff retry
    throw err;
  }
}
