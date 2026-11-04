export type ReturnStatus = 'PENDING_INSPECTION' | 'RESTOCKED' | 'DAMAGED';

export interface WarehouseReturnRecord {
  id: string;
  orderId: string;
  trackingCode: string;
  courier: 'Steadfast' | 'Pathao' | 'RedX';
  merchantCode: string;
  merchantName: string;
  productTitle: string;
  fullSku: string;
  qty: number;
  targetBin: string;
  currentStockSnapshot: number;
  returnReason: string;
  status: ReturnStatus;
  receivedAt: string;
  processedAt?: string;
  inspectorNote?: string;
  imageUrl: string;
}

export type { StockAuditLogItem } from '@/features/admin/stock';
