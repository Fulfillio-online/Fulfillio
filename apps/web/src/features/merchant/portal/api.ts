import {
  MerchantAsnRecord,
  MerchantOrderItem,
  MerchantProductItem,
  MerchantProfileData,
  MerchantWebhookLog,
  ResellerMemo,
} from './types';
import {
  INITIAL_MERCHANT_ASNS,
  INITIAL_MERCHANT_MEMOS,
  INITIAL_MERCHANT_ORDERS,
  INITIAL_MERCHANT_PRODUCTS,
  INITIAL_MERCHANT_PROFILE,
  INITIAL_WEBHOOK_LOGS,
  STORAGE_KEY_MERCHANT_ASNS,
  STORAGE_KEY_MERCHANT_MEMOS,
  STORAGE_KEY_MERCHANT_ORDERS,
  STORAGE_KEY_MERCHANT_PRODUCTS,
  STORAGE_KEY_MERCHANT_PROFILE,
} from './mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('fulfillio_token') || localStorage.getItem('token');
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

export const merchantApi = {
  async getProfile(): Promise<MerchantProfileData> {
    const remote = await safeFetch<MerchantProfileData>('/merchants/profile');
    if (remote) return remote;
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(STORAGE_KEY_MERCHANT_PROFILE);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {}
      }
    }
    return INITIAL_MERCHANT_PROFILE;
  },

  async updateProfile(updates: Partial<MerchantProfileData>): Promise<MerchantProfileData> {
    const remote = await safeFetch<MerchantProfileData>('/merchants/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (remote) return remote;
    return updates as MerchantProfileData;
  },

  async uploadDocument(file: File): Promise<string | null> {
    const remote = await safeFetch<{ url: string }>('/merchants/profile/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, fileType: file.type }),
    });
    return remote?.url || null;
  },

  async getProducts(): Promise<MerchantProductItem[]> {
    const remote = await safeFetch<any[]>('/inventory/products');
    if (remote && Array.isArray(remote) && remote.length > 0) {
      return remote.flatMap((p) =>
        (p.variants || []).map((v: any) => ({
          id: v.id || p.id,
          title: p.title || v.title,
          variantLabel: v.title || 'Standard',
          sku: v.sku,
          barcode: v.barcode || '',
          stock: v.inventoryItems?.[0]?.quantityAvailable ?? 25,
          reserved: v.inventoryItems?.[0]?.quantityReserved ?? 0,
          price: Number(v.price) || 0,
          bin: v.defaultBinCode || 'A-01-01',
        }))
      );
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(STORAGE_KEY_MERCHANT_PRODUCTS);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: any) => {
              const price = Number(p.price) || 0;
              const costPrice = p.costPrice !== undefined ? Number(p.costPrice) : Math.round(price * 0.52);
              const profit = p.profit !== undefined ? Number(p.profit) : (price - costPrice);
              const profitMargin = p.profitMargin !== undefined ? Number(p.profitMargin) : (price > 0 ? Math.round((profit / price) * 100) : 0);
              return {
                ...p,
                price,
                costPrice,
                profit,
                profitMargin,
                category: p.category || 'Apparel',
                status: p.status || (p.stock === 0 ? 'DRAFT' : 'PUBLISHED'),
                totalOrders: p.totalOrders ?? 0,
              };
            });
          }
        } catch {}
      }
    }
    return INITIAL_MERCHANT_PRODUCTS;
  },

  async getOrders(): Promise<MerchantOrderItem[]> {
    const remote = await safeFetch<{ items: any[] }>('/orders');
    if (remote?.items && Array.isArray(remote.items) && remote.items.length > 0) {
      return remote.items.map((o) => ({
        id: o.orderNumber || o.id,
        date: new Date(o.createdAt).toLocaleDateString(),
        customer: o.customerName || 'Customer',
        phone: o.customerPhone || '',
        address: o.customerAddress || '',
        productId: o.items?.[0]?.variantId || '',
        items: o.items?.[0]?.variant?.title || 'Ordered Items',
        qty: o.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 1,
        amount: Number(o.codAmount) || 0,
        memoCode: o.memoCode || 'MEMO-DEFAULT',
        status: o.status,
        courier: o.courierProvider || 'STEADFAST',
      }));
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(STORAGE_KEY_MERCHANT_ORDERS);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {}
      }
    }
    return INITIAL_MERCHANT_ORDERS;
  },

  async getMemos(): Promise<ResellerMemo[]> {
    const remote = await safeFetch<any[]>('/memos');
    if (remote && Array.isArray(remote) && remote.length > 0) {
      return remote.map((m) => ({
        id: m.id,
        code: m.memoCode,
        name: m.name,
        resellerName: m.designConfig?.resellerName || m.name,
        phone: m.designConfig?.phone || '',
        address: m.designConfig?.address || '',
        note: m.designConfig?.note || '',
        accentColor: m.designConfig?.accentColor || '#4f46e5',
        paperSize: m.designConfig?.paperSize || 'THERMAL_4X6',
        isDefault: Boolean(m.isDefault),
        created: new Date(m.createdAt).toLocaleDateString(),
      }));
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(STORAGE_KEY_MERCHANT_MEMOS);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {}
      }
    }
    return INITIAL_MERCHANT_MEMOS;
  },

  async getInboundAsns(): Promise<MerchantAsnRecord[]> {
    const remote = await safeFetch<any[]>('/inbound');
    if (remote && Array.isArray(remote) && remote.length > 0) {
      return remote.map((s) => ({
        id: s.id,
        asnCode: s.asnCode,
        carrierName: s.carrierName || 'Courier',
        trackingRef: s.trackingNumber || '',
        expectedArrivalDate: s.expectedArrivalDate ? new Date(s.expectedArrivalDate).toISOString().split('T')[0] : '',
        status: s.status,
        notes: s.notes,
        createdAt: new Date(s.createdAt).toLocaleDateString(),
        items: (s.items || []).map((it: any) => ({
          sku: it.variant?.sku || it.variantId,
          title: it.variant?.title || 'Shipment SKU',
          expectedQty: it.expectedQuantity,
          receivedGoodQty: it.receivedGoodQuantity,
          receivedDamagedQty: it.receivedDamagedQuantity,
          binCode: it.assignedBinCode,
        })),
      }));
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(STORAGE_KEY_MERCHANT_ASNS);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {}
      }
    }
    return INITIAL_MERCHANT_ASNS;
  },

  async createInboundAsn(asn: Partial<MerchantAsnRecord>): Promise<MerchantAsnRecord | null> {
    const payload = {
      carrierName: asn.carrierName,
      trackingReference: asn.trackingRef,
      expectedArrivalDate: asn.expectedArrivalDate,
      notes: asn.notes,
      items: (asn.items || []).map((it) => ({
        variantId: it.sku,
        expectedQuantity: it.expectedQty,
        assignedBinCode: it.binCode,
      })),
    };
    const remote = await safeFetch<any>('/inbound', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return remote || null;
  },

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    const remote = await safeFetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return Boolean(remote);
  },

  async getWebhookLogs(): Promise<MerchantWebhookLog[]> {
    return INITIAL_WEBHOOK_LOGS;
  },

  async saveWebhookUrl(webhookUrl: string): Promise<boolean> {
    const remote = await safeFetch('/merchants/webhooks', {
      method: 'POST',
      body: JSON.stringify({ webhookUrl }),
    });
    return Boolean(remote);
  },
};
