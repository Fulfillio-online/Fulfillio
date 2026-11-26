export type PipelineMainTab = 'pick' | 'pack' | 'dispatch';

export type OrderStage =
  | 'PICK'
  | 'WAITING'
  | 'PACK'
  | 'DISPATCH'
  | 'HANDED_OVER'
  | 'CANCELLED';

export type AllOrdersStatusFilter =
  | 'ALL'
  | 'PICK'
  | 'WAITING'
  | 'PACK'
  | 'DISPATCH'
  | 'COURIER_BOOKED'
  | 'HANDED_OVER'
  | 'RETURNED'
  | 'CANCELLED';

export type DateRangePreset =
  | 'ALL_TIME'
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_MONTH'
  | 'CUSTOM';

export type CourierPartner = 'Steadfast' | 'Pathao' | 'RedX' | '';

export interface OrderItem {
  sku: string;
  title: string;
  image: string;
  color: string;
  size: string;
  qty: number;
  unitPrice: number;
  bin: string;
}

export interface WarehousePipelineOrder {
  id: string;
  createdAt: string;
  createdAtIso?: string;
  dbStatus?: string;
  merchantCode: string;
  merchantName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  // single item fields for backward compatibility
  productTitle: string;
  productImage: string;
  bin: string;
  color: string;
  size: string;
  sku: string;
  qty: number;
  stockAvailable: number;
  // multiple items support
  items?: OrderItem[];
  memoCode: string;
  resellerName: string;
  resellerPhone: string;
  resellerAddress: string;
  resellerLogo?: string;
  codAmount: number;
  totalAmount?: number;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  advancePayment?: number;
  advancePaymentMethod?: string;
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid';
  courier: CourierPartner;
  trackingCode?: string;
  stage: OrderStage;
  holdReason?: string;
  isMemoPrinted?: boolean;
  isCourierBooked?: boolean;
  handedOverAt?: string;
}

export interface CatalogProductItem {
  merchantCode: string;
  merchantName: string;
  title: string;
  productImage: string;
  bin: string;
  color: string;
  size: string;
  sku: string;
  price: number;
  stock: number;
}

export interface ResellerMemoItem {
  code: string;
  resellerName: string;
  phone: string;
  address: string;
  logoUrl?: string;
}

export type PendingConfirmationAction =
  | {
      type: 'MARK_PICKED';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'MARK_WAITING';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'RESUME_PICK';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'PRINT_AND_PACK';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'BOOK_COURIER';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'CONFIRM_HANDOVER';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'CANCEL_ORDER';
      orders: WarehousePipelineOrder[];
    };

/**
 * Format date string for Order table row (Today / Yesterday / Clean Date without time)
 */
export function formatOrderDate(createdAt: string): string {
  if (!createdAt) return 'Today';
  const lower = createdAt.toLowerCase();
  if (lower.includes('today')) return 'Today';
  if (lower.includes('yesterday')) return 'Yesterday';

  // Strip timestamp part after comma or space
  const withoutTime = createdAt.split(',')[0].trim();
  return withoutTime || createdAt;
}

export function parseOrderDate(
  order: Pick<WarehousePipelineOrder, 'createdAt' | 'createdAtIso'>
): Date | null {
  if (order.createdAtIso) {
    const iso = new Date(order.createdAtIso);
    if (!Number.isNaN(iso.getTime())) return iso;
  }
  const raw = (order.createdAt || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const now = new Date();
  if (lower.includes('just now') || lower.includes('today')) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
  }
  if (lower.includes('yesterday')) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return y;
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const datePart = raw.split(',')[0].trim();
  const parsedPart = new Date(datePart);
  return Number.isNaN(parsedPart.getTime()) ? null : parsedPart;
}

export function formatFullOrderDate(
  order: Pick<WarehousePipelineOrder, 'createdAt' | 'createdAtIso'>
): { label: string; full: string } {
  const parsed = parseOrderDate(order);
  if (!parsed) {
    const fallback = formatOrderDate(order.createdAt);
    return { label: fallback, full: order.createdAt || fallback };
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfOrder = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfOrder.getTime()) / (1000 * 60 * 60 * 24)
  );
  const full = parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const shortDate = parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  if (diffDays === 0) return { label: `Today · ${shortDate}`, full };
  if (diffDays === 1) return { label: `Yesterday · ${shortDate}`, full };
  return { label: shortDate, full };
}

export function getOrderHistoryStatus(
  order: WarehousePipelineOrder
): Exclude<AllOrdersStatusFilter, 'ALL'> {
  const dbUpper = (order.dbStatus || '').toUpperCase();
  if (dbUpper === 'RETURNED') return 'RETURNED';
  if (
    order.stage === 'HANDED_OVER' ||
    dbUpper === 'DELIVERED' ||
    dbUpper === 'PARTIAL_DELIVERED'
  ) {
    return 'HANDED_OVER';
  }
  if (order.stage === 'DISPATCH' && order.isCourierBooked) {
    return 'COURIER_BOOKED';
  }
  return order.stage;
}
