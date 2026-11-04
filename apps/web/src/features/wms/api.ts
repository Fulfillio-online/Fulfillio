import { WmsOrder, WmsStage } from './types';
import { INITIAL_WMS_ORDERS } from './mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const STORAGE_KEY_ORDERS = 'fulfillio_wms_orders_v1';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token =
    localStorage.getItem('fulfillio_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null; // Graceful fallback
  }
}

interface BackendOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  variant?: {
    id: string;
    sku: string;
    title: string;
    defaultBinCode?: string;
    product?: {
      title: string;
    };
    inventoryItems?: Array<{
      location?: {
        binCode: string;
        zone: string;
      };
    }>;
  };
}

interface BackendOrder {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city?: string;
  status: string;
  memoCode?: string;
  memoPrintedAt?: string;
  packagingType?: string;
  courierProvider?: string;
  trackingCode?: string;
  totalAmount: number | string;
  merchant?: {
    merchantCode: string;
    businessName: string;
  };
  items?: BackendOrderItem[];
}

interface BackendOrderListResponse {
  items: BackendOrder[];
  total: number;
  page: number;
  limit: number;
}

export function mapBackendOrderToWms(order: BackendOrder): WmsOrder {
  const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
  const variant = firstItem?.variant;
  const locationBin =
    variant?.inventoryItems && variant.inventoryItems.length > 0
      ? variant.inventoryItems[0]?.location?.binCode
      : null;

  // Stage mapping
  let stage: WmsStage = 'READY_TO_PICK';
  const statusUpper = (order.status || '').toUpperCase();
  if (statusUpper === 'PICKING') {
    stage = 'PICKED';
  } else if (statusUpper === 'PACKED') {
    stage = order.trackingCode ? 'BOOKED' : 'PACKED';
  } else if (statusUpper === 'DISPATCHED' || statusUpper === 'DELIVERED' || statusUpper === 'COMPLETED') {
    stage = 'DISPATCHED';
  } else {
    stage = 'READY_TO_PICK';
  }

  // Courier display formatting
  let courierFormatted = 'Steadfast';
  if (order.courierProvider) {
    const cUpper = order.courierProvider.toUpperCase();
    if (cUpper.includes('PATHAO')) courierFormatted = 'Pathao';
    else if (cUpper.includes('REDX')) courierFormatted = 'RedX';
    else courierFormatted = 'Steadfast';
  }

  const createdDate = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Today';

  return {
    id: order.id,
    date: `Today, ${createdDate}`,
    customer: order.customerName || 'Anonymous Customer',
    phone: order.customerPhone || '01700000000',
    address: order.customerAddress || 'Dhaka',
    city: order.city || 'Dhaka',
    itemTitle: variant?.product?.title || variant?.title || 'Retail Product',
    variant: variant?.title || 'Standard',
    sku: variant?.sku || 'SKU-UNKNOWN',
    bin: locationBin || variant?.defaultBinCode || 'A-01-02-03',
    qty: firstItem?.quantity || 1,
    memoCode: order.memoCode || 'MEMO-DEFAULT',
    reseller: order.merchant?.businessName || 'Urban Threads BD',
    courier: courierFormatted,
    amount: Number(order.totalAmount || 0),
    stage,
    packagingType: order.packagingType || 'POLY_LARGE',
    trackingNumber: order.trackingCode || undefined,
    packedAt: order.memoPrintedAt
      ? new Date(order.memoPrintedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined,
  };
}

export const wmsApi = {
  /**
   * Fetch all active orders from backend with graceful fallback to local cache
   */
  async getOrders(): Promise<WmsOrder[]> {
    const res = await safeFetch<BackendOrderListResponse>('/orders?limit=100');
    if (res && res.items && res.items.length > 0) {
      return res.items.map(mapBackendOrderToWms);
    }

    // Fallback: Read local storage cache if available
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {}
      }
    }

    return INITIAL_WMS_ORDERS;
  },

  /**
   * Step 1: Advance order to PICKING status in database
   */
  async markPicked(orderId: string): Promise<boolean> {
    const res = await safeFetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PICKING' }),
    });
    return res !== null;
  },

  /**
   * Step 2: Lock 4x6 Thermal Memo print and assign packaging material
   */
  async packAndPrint(orderId: string, packagingType: string): Promise<boolean> {
    const res = await safeFetch(`/orders/batch-print-lock`, {
      method: 'POST',
      body: JSON.stringify({ orderIds: [orderId], packagingType }),
    });
    return res !== null;
  },

  /**
   * Step 3: Call courier API booking (Steadfast, Pathao, RedX)
   */
  async bookCourier(orderId: string, courierName: string): Promise<{ trackingCode?: string } | null> {
    const provider =
      courierName.toUpperCase().includes('PATHAO')
        ? 'PATHAO'
        : courierName.toUpperCase().includes('REDX')
        ? 'REDX'
        : 'STEADFAST';

    const res = await safeFetch<{ trackingCode?: string; consignmentId?: string }>('/shipping/book', {
      method: 'POST',
      body: JSON.stringify({ orderId, provider }),
    });

    return res;
  },

  /**
   * Step 4: Dispatch parcels to courier rider and log handover
   */
  async handoverToCourier(orderIds: string[]): Promise<boolean> {
    const promises = orderIds.map((id) =>
      safeFetch(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'DISPATCHED' }),
      }),
    );
    const results = await Promise.all(promises);
    return results.some((r) => r !== null);
  },

  /**
   * Fetch official handover manifest for a courier partner
   */
  async getManifest(courierName: string): Promise<any | null> {
    const provider =
      courierName.toUpperCase().includes('PATHAO')
        ? 'PATHAO'
        : courierName.toUpperCase().includes('REDX')
        ? 'REDX'
        : 'STEADFAST';

    return safeFetch(`/shipping/manifest/${provider}`);
  },
};
