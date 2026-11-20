import { getActiveMerchantSession, getMerchantProductsKey, getMerchantOrdersKey } from '@/lib/warehouseSync';
import {
  MerchantAsnRecord,
  MerchantOrderItem,
  OrderLineItem,
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
  const session = typeof window !== 'undefined' ? getActiveMerchantSession() : null;
  const merchantCode = session?.merchantCode || 'MC-101';
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-code': merchantCode,
        ...getAuthHeader(),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      console.warn(`[API] ${endpoint} returned status ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[API] safeFetch failed for ${endpoint}:`, err);
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
    const session = typeof window !== 'undefined' ? getActiveMerchantSession() : null;
    const code = session?.merchantCode || 'MC-101';
    const remote = await safeFetch<any[]>(`/inventory/products?merchantCode=${code}`, {
      headers: { 'x-merchant-code': code },
    });
    if (remote && Array.isArray(remote)) {
      return remote.map((p) => {
        const variants = p.variants || [];
        const totalStock = variants.reduce(
          (sum: number, v: any) => sum + (v.inventoryItems?.[0]?.quantityAvailable ?? 0),
          0
        );
        const totalReserved = variants.reduce(
          (sum: number, v: any) => sum + (v.inventoryItems?.[0]?.quantityReserved ?? 0),
          0
        );
        const firstVariant = variants[0];
        const minPrice = variants.length > 0
          ? Math.min(...variants.map((v: any) => Number(v.price) || 0))
          : 0;
        const maxPrice = variants.length > 0
          ? Math.max(...variants.map((v: any) => Number(v.price) || 0))
          : 0;

        const colorSet = new Set<string>();
        const sizeSet = new Set<string>();
        const colorMap = new Map<string, { id: string; name: string; hex: string; imageUrl?: string; sizes: string[] }>();

        const variantsList = variants.map((v: any) => {
          const colorName = v.attributes?.color || v.title?.split('/')[0]?.trim() || '';
          const sizeName = v.attributes?.size || v.title?.split('/')[1]?.trim() || '';
          const colorHex = v.attributes?.hex || '#111827';
          const variantImg = v.imageUrl || v.attributes?.imageUrl;
          if (colorName) colorSet.add(colorName);
          if (sizeName) sizeSet.add(sizeName);

          if (colorName && !colorMap.has(colorName)) {
            colorMap.set(colorName, {
              id: `c-${colorMap.size + 1}`,
              name: colorName,
              hex: colorHex,
              imageUrl: variantImg,
              sizes: [],
            });
          } else if (colorName && variantImg && colorMap.has(colorName) && !colorMap.get(colorName)!.imageUrl) {
            colorMap.get(colorName)!.imageUrl = variantImg;
          }
          if (colorName && sizeName && colorMap.has(colorName)) {
            const entry = colorMap.get(colorName)!;
            if (!entry.sizes.includes(sizeName)) entry.sizes.push(sizeName);
          }

          const vStock = v.inventoryItems?.[0]?.quantityAvailable ?? 0;
          return {
            id: v.id,
            variantSku: v.sku,
            color: colorName,
            size: sizeName,
            imageUrl: variantImg,
            attributeName: v.attributes?.attributeName,
            attributeValue: v.attributes?.attributeValue,
            stock: vStock,
          };
        });

        const storedColors = variants[0]?.attributes?.allColors;
        const colors = (Array.isArray(storedColors) && storedColors.length > 0)
          ? storedColors
          : (p.attributes?.colors || Array.from(colorMap.values()));
        const sizes = p.attributes?.sizes || Array.from(sizeSet);

        const price = minPrice || Number(firstVariant?.price) || 0;
        const costPrice = Math.round(price * 0.52);
        const profit = price - costPrice;
        const profitMargin = price > 0 ? Math.round((profit / price) * 100) : 0;

        return {
          id: p.id,
          title: p.title,
          variantLabel: variants.length > 1 ? `${variants.length} Variants` : (firstVariant?.title || 'Standard'),
          sku: p.baseSku,
          barcode: firstVariant?.barcode || '',
          stock: totalStock,
          reserved: totalReserved,
          price,
          costPrice,
          profit,
          profitMargin,
          minPrice,
          maxPrice,
          bin: firstVariant?.defaultBinCode || 'A-01-01',
          status: 'PUBLISHED' as const,
          imageUrl: p.imageUrl,
          images: p.images && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []),
          description: p.description,
          category: variants[0]?.attributes?.category || p.attributes?.category || 'Fashion',
          subcategory: variants[0]?.attributes?.subcategory || p.attributes?.subcategory || 'Apparel',
          productType: (variants[0]?.attributes?.productType || p.attributes?.productType as any) || 'FASHION',
          keyFeatures: variants[0]?.attributes?.keyFeatures || p.attributes?.keyFeatures || [],
          colors: colors.length > 0 ? colors : [{ id: 'c-1', name: 'Standard', hex: '#111827', sizes: Array.from(sizeSet) }],
          sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
          variantsList,
          totalOrders: 0,
        };
      });
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(getMerchantProductsKey(code));
      if (local !== null) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
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
      return code === 'MC-101' ? INITIAL_MERCHANT_PRODUCTS : [];
    }
    return [];
  },

  async getOrders(): Promise<MerchantOrderItem[]> {
    const session = typeof window !== 'undefined' ? getActiveMerchantSession() : null;
    const code = session?.merchantCode || 'MC-101';
    const remote = await safeFetch<{ items: any[] }>(`/orders?merchantCode=${code}`, {
      headers: { 'x-merchant-code': code },
    });
    if (remote?.items && Array.isArray(remote.items) && remote.items.length > 0) {
      return remote.items.map((o) => {
        const itemNames =
          o.items && o.items.length > 0
            ? o.items
                .map((it: any) => `${it.productTitle || it.variant?.title || 'Product'} x ${it.quantity}`)
                .join(', ')
            : 'Ordered Items';
        const totalQty =
          o.items && o.items.length > 0
            ? o.items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0)
            : 1;

        const mappedLineItems: OrderLineItem[] = (o.items || []).map((it: any) => ({
          id: it.id || it.variantId || 'item-1',
          title: it.productTitle || it.variant?.product?.title || it.variant?.title || 'Product',
          variant: it.variantLabel || it.variant?.title || 'Standard',
          sku: it.sku || it.variant?.sku || '',
          price: Number(it.unitPrice) || 0,
          quantity: it.quantity || 1,
          total: (Number(it.unitPrice) || 0) * (it.quantity || 1),
          imageUrl: it.variant?.imageUrl || it.variant?.product?.imageUrl || '',
        }));

        return {
          id: o.orderNumber || o.externalOrderId || o.id,
          orderNumber: o.externalOrderId || o.orderNumber || o.id,
          date: new Date(o.createdAt).toLocaleDateString(),
          customer: o.customerName || 'Customer',
          phone: o.customerPhone || '',
          address: o.customerAddress || '',
          productId: o.items?.[0]?.variantId || '',
          items: itemNames,
          qty: totalQty,
          amount: Number(o.totalAmount) || Number(o.codAmount) || 0,
          subtotal: Number(o.subtotal) || Number(o.totalAmount) || 0,
          deliveryFee: Number(o.deliveryFee) || 0,
          discount: Number(o.discount) || 0,
          advancePayment: Number(o.advancePayment) || 0,
          codAmount: Number(o.codAmount) || 0,
          memoCode: o.memoCode || 'MEMO-DEFAULT',
          status: o.status,
          courier: o.courierProvider || 'Steadfast',
          paymentMethod: o.paymentMethod || 'Cash on Delivery',
          paymentStatus:
            (o.paymentStatus as any) || (Number(o.codAmount) === 0 ? 'Paid' : 'Unpaid'),
          advancePaymentMethod: o.advancePaymentMethod,
          advanceTrxId: o.advanceTrxId,
          lineItems: mappedLineItems,
          timeline:
            (Array.isArray(o.timeline) ? o.timeline : null) || [
              {
                title: 'Order Placed',
                description: `Order registered in PostgreSQL database`,
                timestamp: new Date(o.createdAt).toLocaleTimeString(),
                isCompleted: true,
              },
            ],
        };
      });
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(getMerchantOrdersKey(code));
      if (local !== null) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return code === 'MC-101' ? INITIAL_MERCHANT_ORDERS : [];
    }
    return [];
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
        logoUrl: m.designConfig?.logoUrl || undefined,
        accentColor: m.designConfig?.accentColor,
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

  async createProduct(product: MerchantProductItem): Promise<{ ok: boolean; data?: any; error?: string }> {
    const session = typeof window !== 'undefined' ? getActiveMerchantSession() : null;
    const code = session?.merchantCode || 'MC-101';
    const rawSku = product.sku || 'SKU-001';
    const cleanBaseSku = rawSku.replace(/^MC-\d+-/i, '').replace(/[^a-zA-Z0-9_-]/g, '-');
    const allDistinctImages = Array.from(
      new Set(
        [
          product.imageUrl,
          ...(product.colors || []).map((c) => c.imageUrl),
          ...(product.variantsList || []).map((v: any) => v.imageUrl),
        ].filter((u): u is string => Boolean(u && u.trim()))
      )
    );

    const payload = {
      merchantCode: code,
      title: product.title,
      description: product.description || '',
      baseSku: cleanBaseSku || `PROD-${Date.now().toString().slice(-4)}`,
      imageUrl: product.imageUrl || allDistinctImages[0],
      images: allDistinctImages,
      variants: (product.variantsList && product.variantsList.length > 0)
        ? product.variantsList.map((v) => {
            const matchingColor = (product.colors || []).find(
              (c) => (c.name || '').trim().toLowerCase() === (v.color || '').trim().toLowerCase()
            );
            const colorImg = matchingColor?.imageUrl || (v as any).imageUrl || product.imageUrl || '';
            return {
              title: `${v.color || 'Standard'} / ${v.size || 'Standard'}`,
              variantCode: `${(v.color || 'STD').slice(0, 3)}-${(v.size || 'STD').slice(0, 3)}`.toUpperCase(),
              price: Number(product.price) || 0,
              defaultBinCode: 'A-01-01',
              initialStock: Math.max(0, Number(v.stock) || 0),
              imageUrl: colorImg,
              attributes: {
                color: v.color,
                size: v.size,
                hex: matchingColor?.hex || '#111827',
                imageUrl: colorImg,
                attributeName: v.attributeName,
                attributeValue: v.attributeValue,
                allColors: product.colors || [],
                category: product.category,
                subcategory: product.subcategory,
                productType: product.productType,
                keyFeatures: product.keyFeatures,
              },
            };
          })
        : [{
            title: product.variantLabel || 'Standard',
            variantCode: 'STD',
            price: Number(product.price) || 0,
            defaultBinCode: 'A-01-01',
            initialStock: Math.max(0, Number(product.stock) || 0),
            imageUrl: product.imageUrl,
            attributes: {
              allColors: product.colors || [],
              category: product.category,
              subcategory: product.subcategory,
              productType: product.productType,
              keyFeatures: product.keyFeatures,
            },
          }],
    };

    try {
      const res = await fetch(`${API_BASE}/inventory/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-code': code,
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.message) {
            errMessage = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
          }
        } catch {}
        return { ok: false, error: errMessage };
      }

      const data = await res.json();
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network request failed' };
    }
  },

  async updateProduct(productId: string, product: Partial<MerchantProductItem>): Promise<{ ok: boolean; data?: any; error?: string }> {
    const session = typeof window !== 'undefined' ? getActiveMerchantSession() : null;
    const code = session?.merchantCode || 'MC-101';
    const rawSku = product.sku || '';
    const cleanBaseSku = rawSku ? rawSku.replace(/^MC-\d+-/i, '').replace(/[^a-zA-Z0-9_-]/g, '-') : undefined;
    const activeCurrentImages = Array.from(
      new Set(
        [
          product.imageUrl,
          ...(product.colors || []).map((c) => c.imageUrl),
          ...(product.variantsList || []).map((v: any) => v.imageUrl),
        ].filter((u): u is string => Boolean(u && u.trim()))
      )
    );
    const allDistinctImages = activeCurrentImages.length > 0 ? activeCurrentImages : (product.images || []);

    const payload: any = {
      merchantCode: code,
      title: product.title,
      description: product.description,
      baseSku: cleanBaseSku,
      imageUrl: product.imageUrl !== undefined ? product.imageUrl : allDistinctImages[0],
      images: product.images !== undefined ? product.images : allDistinctImages,
    };

    if (product.variantsList && product.variantsList.length > 0) {
      payload.variants = product.variantsList.map((v) => {
        const matchingColor = (product.colors || []).find(
          (c) => (c.name || '').trim().toLowerCase() === (v.color || '').trim().toLowerCase()
        );
        const colorImg = matchingColor?.imageUrl || (v as any).imageUrl || product.imageUrl || '';
        return {
          id: v.id,
          sku: v.variantSku,
          title: `${v.color || 'Standard'} / ${v.size || 'Standard'}`,
          variantCode: `${(v.color || 'STD').slice(0, 3)}-${(v.size || 'STD').slice(0, 3)}`.toUpperCase(),
          price: Number(product.price) || 0,
          defaultBinCode: 'A-01-01',
          initialStock: Math.max(0, Number(v.stock) || 0),
          imageUrl: colorImg,
          attributes: {
            color: v.color,
            size: v.size,
            hex: matchingColor?.hex || '#111827',
            imageUrl: colorImg,
            attributeName: v.attributeName,
            attributeValue: v.attributeValue,
            allColors: product.colors || [],
            category: product.category,
            subcategory: product.subcategory,
            productType: product.productType,
            keyFeatures: product.keyFeatures,
          },
        };
      });
    }

    try {
      const res = await fetch(`${API_BASE}/inventory/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-code': code,
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.message) {
            errMessage = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
          }
        } catch {}
        return { ok: false, error: errMessage };
      }

      const data = await res.json();
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network request failed' };
    }
  },

  async createOrder(order: MerchantOrderItem): Promise<{ ok: boolean; data?: any; error?: string }> {
    const session = typeof window !== 'undefined' ? getActiveMerchantSession() : null;
    const code = session?.merchantCode || 'MC-101';

    const payload = {
      merchantCode: code,
      externalOrderId: order.orderNumber || order.id,
      customerName: order.customer,
      customerPhone: order.phone,
      customerAddress: order.address,
      city: 'Dhaka',
      memoCode: order.memoCode || 'MEMO-DEFAULT',
      totalAmount: Number(order.amount) || Number(order.codAmount) || 0,
      codAmount: Number(order.codAmount) ?? Number(order.amount) ?? 0,
      subtotal: Number(order.subtotal) ?? Number(order.amount) ?? 0,
      deliveryFee: Number(order.deliveryFee) ?? 0,
      discount: Number(order.discount) ?? 0,
      advancePayment: Number(order.advancePayment) ?? 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || (Number(order.codAmount) === 0 ? 'Paid' : 'Unpaid'),
      advancePaymentMethod: order.advancePaymentMethod,
      advanceTrxId: order.advanceTrxId,
      timeline: order.timeline,
      allowBackorder: true,
      items: (order.lineItems && order.lineItems.length > 0)
        ? order.lineItems.map((li) => ({
            variantId: li.id,
            productId: li.id,
            sku: li.sku,
            title: li.title,
            productTitle: li.title,
            variantLabel: li.variant,
            quantity: li.quantity || 1,
            unitPrice: Number(li.price) || 0,
          }))
        : [{
            variantId: order.productId,
            productId: order.productId,
            sku: '',
            title: order.items || 'Product',
            productTitle: order.items || 'Product',
            variantLabel: 'Standard',
            quantity: order.qty || 1,
            unitPrice: Math.round((Number(order.amount) || 0) / Math.max(1, order.qty || 1)),
          }],
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-code': code,
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.message) {
            errMessage = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
          }
        } catch {}
        return { ok: false, error: errMessage };
      }

      const data = await res.json();
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network request failed' };
    }
  },
};
