export interface OrderCartItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  imageUrl?: string;
  variantLabel: string;
  color: string;
  size: string;
  sku: string;
  unitPrice: number;
  declaredPrice?: number;
  qty: number;
  maxStock: number;
}

export const STORAGE_KEY_ORDER_CART = 'fulfillio_merchant_order_cart_v1';

export function getOrderCart(): OrderCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDER_CART);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrderCart(items: OrderCartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ORDER_CART, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('fulfillio-order-cart-sync', { detail: { items } }));
  } catch {
    // ignore
  }
}

export function addToOrderCart(item: Omit<OrderCartItem, 'id'>): OrderCartItem[] {
  const current = getOrderCart();
  // Check if identical variant/item already exists
  const existingIdx = current.findIndex((it) => {
    if (it.variantId && item.variantId) {
      return it.variantId === item.variantId;
    }
    return (
      it.productId === item.productId &&
      it.color.toLowerCase() === item.color.toLowerCase() &&
      it.size.toLowerCase() === item.size.toLowerCase()
    );
  });

  let updated: OrderCartItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    const existing = updated[existingIdx];
    const effectiveMaxStock = item.maxStock ?? existing.maxStock;
    const newQty = Math.min(effectiveMaxStock || 999, existing.qty + item.qty);
    updated[existingIdx] = {
      ...existing,
      variantId: item.variantId || existing.variantId,
      qty: newQty,
      maxStock: effectiveMaxStock,
      unitPrice: item.unitPrice,
      declaredPrice: item.declaredPrice ?? existing.declaredPrice ?? item.unitPrice,
      sku: item.sku || existing.sku,
      imageUrl: item.imageUrl || existing.imageUrl,
    };
  } else {
    const newEntry: OrderCartItem = {
      ...item,
      declaredPrice: item.declaredPrice ?? item.unitPrice,
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      qty: Math.max(1, item.qty),
    };
    updated = [newEntry, ...current];
  }

  saveOrderCart(updated);
  return updated;
}

export function updateOrderCartItemPrice(id: string, unitPrice: number): OrderCartItem[] {
  const current = getOrderCart();
  const safePrice = Math.max(0, Number(unitPrice) || 0);
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        unitPrice: safePrice,
      };
    }
    return item;
  });
  saveOrderCart(updated);
  return updated;
}

export function updateOrderCartItemQty(id: string, qty: number): OrderCartItem[] {
  const current = getOrderCart();
  if (qty <= 0) {
    return removeOrderCartItem(id);
  }
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        qty: Math.min(item.maxStock || 999, Math.max(1, qty)),
      };
    }
    return item;
  });
  saveOrderCart(updated);
  return updated;
}

export function removeOrderCartItem(id: string): OrderCartItem[] {
  const current = getOrderCart();
  const updated = current.filter((item) => item.id !== id);
  saveOrderCart(updated);
  return updated;
}

export function clearOrderCart(): void {
  saveOrderCart([]);
}
