export type PipelineMainTab = 'all' | 'pick' | 'pack' | 'dispatch';

export type OrderStage =
  | 'PICK'
  | 'WAITING'
  | 'PACK'
  | 'DISPATCH'
  | 'HANDED_OVER'
  | 'CANCELLED';

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
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  advancePayment?: number;
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
