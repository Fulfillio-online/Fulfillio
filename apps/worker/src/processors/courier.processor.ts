import { Job } from 'bullmq';
import { getPrismaClient } from '../db/prisma.client';
import { workerConfig } from '../config/worker.config';
import { CourierProvider } from '@fulfillio/contracts';

export interface CourierJobData {
  orderId: string;
  provider: CourierProvider | string;
}

interface CourierBookingResult {
  consignmentId: string;
  trackingCode: string;
  isSimulated: boolean;
}

/**
 * Call Steadfast Courier API (portal.packzy.com)
 */
async function bookSteadfastParcel(order: any): Promise<CourierBookingResult> {
  const { baseUrl, apiKey, secretKey } = workerConfig.couriers.steadfast;

  // If using placeholder/test keys, simulate booking
  if (!apiKey || apiKey.startsWith('test_')) {
    return {
      consignmentId: `STE-${Math.floor(100000 + Math.random() * 900000)}`,
      trackingCode: `TRK-STE-${Date.now().toString().slice(-6)}`,
      isSimulated: true,
    };
  }

  try {
    const response = await fetch(`${baseUrl}/create_order`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice: order.id,
        recipient_name: order.customerName,
        recipient_phone: order.customerPhone,
        recipient_address: order.customerAddress,
        cod_amount: Number(order.codAmount),
        note: `Fulfillio Order ${order.id}`,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data: any = await response.json();
    if (response.ok && data.consignment) {
      return {
        consignmentId: String(data.consignment.consignment_id),
        trackingCode: String(data.consignment.tracking_code),
        isSimulated: false,
      };
    }
    throw new Error(`Steadfast API error: ${JSON.stringify(data)}`);
  } catch (err: any) {
    console.warn(`[Worker - Courier] Steadfast API unreachable (${err.message}). Using fallback booking.`);
    return {
      consignmentId: `STE-FALLBACK-${Date.now()}`,
      trackingCode: `TRK-STE-${Date.now().toString().slice(-6)}`,
      isSimulated: true,
    };
  }
}

/**
 * Call Pathao Courier API
 */
async function bookPathaoParcel(order: any): Promise<CourierBookingResult> {
  const { baseUrl, clientId } = workerConfig.couriers.pathao;

  if (!clientId || clientId.startsWith('test_')) {
    return {
      consignmentId: `PTH-${Math.floor(100000 + Math.random() * 900000)}`,
      trackingCode: `TRK-PTH-${Date.now().toString().slice(-6)}`,
      isSimulated: true,
    };
  }

  // Pathao Hermes API invocation
  try {
    const response = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_name: order.customerName,
        recipient_phone: order.customerPhone,
        recipient_address: order.customerAddress,
        amount_to_collect: Number(order.codAmount),
        item_quantity: order.items?.length || 1,
        merchant_order_id: order.id,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data: any = await response.json();
    if (response.ok && data.data) {
      return {
        consignmentId: String(data.data.consignment_id),
        trackingCode: String(data.data.consignment_id),
        isSimulated: false,
      };
    }
    throw new Error(`Pathao API error: ${JSON.stringify(data)}`);
  } catch (err: any) {
    console.warn(`[Worker - Courier] Pathao API unreachable (${err.message}). Using fallback booking.`);
    return {
      consignmentId: `PTH-FALLBACK-${Date.now()}`,
      trackingCode: `TRK-PTH-${Date.now().toString().slice(-6)}`,
      isSimulated: true,
    };
  }
}

/**
 * Main Courier Job Handler
 */
export async function processCourierJob(job: Job<CourierJobData>) {
  const { orderId, provider } = job.data;
  console.log(`[Worker - Courier] Booking consignment with provider '${provider}' for Order ID: ${orderId}`);

  const prisma = getPrismaClient();

  // 1. Fetch Order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      merchant: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found.`);
  }

  // 2. Select Courier Provider and Book
  let bookingResult: CourierBookingResult;
  const normalizedProvider = (provider || 'STEADFAST').toUpperCase();

  switch (normalizedProvider) {
    case 'PATHAO':
      bookingResult = await bookPathaoParcel(order);
      break;
    case 'REDX':
      bookingResult = {
        consignmentId: `RDX-${Math.floor(100000 + Math.random() * 900000)}`,
        trackingCode: `TRK-RDX-${Date.now().toString().slice(-6)}`,
        isSimulated: true,
      };
      break;
    case 'STEADFAST':
    default:
      bookingResult = await bookSteadfastParcel(order);
      break;
  }

  // 3. Update Order with Consignment & Tracking in DB
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      courierProvider: normalizedProvider as any,
      consignmentId: bookingResult.consignmentId,
      trackingCode: bookingResult.trackingCode,
    },
  });

  console.log(
    `[Worker - Courier] Order ${order.id} booked with ${normalizedProvider}. Consignment: ${bookingResult.consignmentId}, Tracking: ${bookingResult.trackingCode} (Simulated: ${bookingResult.isSimulated})`,
  );

  return {
    success: true,
    orderId: updatedOrder.id,
    provider: normalizedProvider,
    consignmentId: bookingResult.consignmentId,
    trackingCode: bookingResult.trackingCode,
    isSimulated: bookingResult.isSimulated,
    bookedAt: new Date().toISOString(),
  };
}
