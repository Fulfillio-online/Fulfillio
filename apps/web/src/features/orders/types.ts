export type PipelineMainTab = 'all' | 'pick' | 'pack' | 'dispatch';

export type OrderStage =
  | 'PICK'
  | 'WAITING'
  | 'PACK'
  | 'DISPATCH'
  | 'HANDED_OVER'
  | 'CANCELLED';

export type CourierPartner = 'Steadfast' | 'Pathao' | 'RedX';

export interface WarehousePipelineOrder {
  id: string;
  createdAt: string;
  merchantCode: string;
  merchantName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  productTitle: string;
  productImage: string;
  bin: string;
  color: string;
  size: string;
  sku: string;
  qty: number;
  stockAvailable: number;
  memoCode: string;
  resellerName: string;
  resellerPhone: string;
  resellerAddress: string;
  codAmount: number;
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
