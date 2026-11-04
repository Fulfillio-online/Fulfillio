import { Worker } from 'bullmq';
import { workerConfig } from './config/worker.config';
import { processPdfJob } from './processors/pdf.processor';
import { processCourierJob } from './processors/courier.processor';
import { processWebhookJob } from './processors/webhook.processor';
import { disconnectPrisma } from './db/prisma.client';

console.log('====================================================');
console.log('   Fulfillio BullMQ Standalone Background Worker    ');
console.log('====================================================');
console.log(`[Config] Connecting to Redis at ${workerConfig.redis.host}:${workerConfig.redis.port}...`);

const redisConnection = {
  host: workerConfig.redis.host,
  port: workerConfig.redis.port,
  password: workerConfig.redis.password,
  maxRetriesPerRequest: null,
};

// 1. PDF / Label Generation Worker
const pdfWorker = new Worker(
  'jobs.pdf',
  async (job) => {
    return processPdfJob(job);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

// 2. Webhook Outbound Dispatch Worker
const webhookWorker = new Worker(
  'jobs.webhooks',
  async (job) => {
    return processWebhookJob(job);
  },
  {
    connection: redisConnection,
    concurrency: 10,
  },
);

// 3. Courier Booking Worker
const courierWorker = new Worker(
  'jobs.couriers',
  async (job) => {
    return processCourierJob(job);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

// Event Listeners
pdfWorker.on('completed', (job) => {
  console.log(`[Worker - PDF] Job #${job.id} (Order: ${job.data?.orderId}) completed successfully.`);
});
pdfWorker.on('failed', (job, err) => {
  console.error(`[Worker - PDF] Job #${job?.id} failed: ${err.message}`);
});

webhookWorker.on('completed', (job) => {
  console.log(`[Worker - Webhook] Job #${job.id} (Event: ${job.data?.event}) delivered.`);
});
webhookWorker.on('failed', (job, err) => {
  console.error(`[Worker - Webhook] Job #${job?.id} failed: ${err.message}`);
});

courierWorker.on('completed', (job) => {
  console.log(`[Worker - Courier] Job #${job.id} (Order: ${job.data?.orderId}) booked.`);
});
courierWorker.on('failed', (job, err) => {
  console.error(`[Worker - Courier] Job #${job?.id} failed: ${err.message}`);
});

console.log('[Fulfillio Worker] All workers active and listening to queues: [jobs.pdf, jobs.webhooks, jobs.couriers]');

// Graceful Shutdown
async function shutdown(signal: string) {
  console.log(`\n[Fulfillio Worker] Received ${signal}. Gracefully stopping workers...`);
  try {
    await Promise.all([
      pdfWorker.close(),
      webhookWorker.close(),
      courierWorker.close(),
    ]);
    await disconnectPrisma();
    console.log('[Fulfillio Worker] All workers and DB connections closed cleanly.');
    process.exit(0);
  } catch (err: any) {
    console.error('[Fulfillio Worker] Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
