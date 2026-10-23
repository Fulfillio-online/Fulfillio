import { Worker } from 'bullmq';
import * as dotenv from 'dotenv';
dotenv.config();

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

console.log('[Fulfillio Worker] Starting BullMQ background processors...');

// 1. PDF / Label Generation Worker
const pdfWorker = new Worker(
  'jobs.pdf',
  async (job) => {
    console.log(`[Worker - PDF] Processing invoice PDF render for order ${job.data.orderId} (Memo: ${job.data.memoCode})`);
    return { rendered: true, timestamp: Date.now() };
  },
  { connection: redisConnection },
);

// 2. Webhook Outbound Dispatch Worker
const webhookWorker = new Worker(
  'jobs.webhooks',
  async (job) => {
    console.log(`[Worker - Webhook] Dispatching event '${job.data.event}' for merchant ${job.data.merchantId}`);
    return { dispatched: true, timestamp: Date.now() };
  },
  { connection: redisConnection },
);

// 3. Courier Booking Worker
const courierWorker = new Worker(
  'jobs.couriers',
  async (job) => {
    console.log(`[Worker - Courier] Booking consignment with provider '${job.data.provider}' for order ${job.data.orderId}`);
    return { booked: true, consignmentId: `CONS-${Date.now()}` };
  },
  { connection: redisConnection },
);

pdfWorker.on('completed', (job) => console.log(`[Worker - PDF] Job ${job.id} completed.`));
webhookWorker.on('completed', (job) => console.log(`[Worker - Webhook] Job ${job.id} completed.`));
courierWorker.on('completed', (job) => console.log(`[Worker - Courier] Job ${job.id} completed.`));
