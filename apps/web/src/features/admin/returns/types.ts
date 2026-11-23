export type ReturnStatus = 'PENDING_INSPECTION' | 'RESTOCKED' | 'DAMAGED';

export type ReturnsTabMode = 'ALL' | 'CANCELLED' | 'RETURNS' | 'STOCK_LEDGER';

export interface CancelledOrderItemRecord {
  id: string; // e.g. 'ORD-9603' or 'ORD-9603-item-1'
  orderId: string;
  merchantCode: string;
  merchantName: string;
  customerName: string;
  customerPhone: string;
  city: string;
  productTitle: string;
  fullSku: string;
  color?: string;
  size?: string;
  qty: number;
  unitPrice: number;
  codAmount: number;
  targetBin: string;
  currentStockSnapshot: number;
  cancelledAt: string;
  cancelReason: string;
  isRestocked: boolean;
  restockedAt?: string;
  restockedBin?: string;
  imageUrl?: string;
  items?: Array<{
    sku: string;
    title: string;
    color?: string;
    size?: string;
    qty: number;
    unitPrice: number;
    bin?: string;
  }>;
}

export interface WarehouseReturnRecord {
  id: string;
  orderId: string;
  trackingCode: string;
  courier: 'Steadfast' | 'Pathao' | 'RedX';
  merchantCode: string;
  merchantName: string;
  productTitle: string;
  fullSku: string;
  color?: string;
  size?: string;
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

export interface RecoveryLedgerEntry {
  id: string; // PRF-2026-XXXX
  timestamp: string;
  sourceType: 'ORDER_CANCELLED' | 'COURIER_RETURN' | 'DAMAGED_QUARANTINE' | 'INITIAL_INTAKE';
  referenceId: string; // Order ID or Tracking ID
  merchantCode: string;
  merchantName: string;
  productTitle: string;
  sku: string;
  color?: string;
  size?: string;
  deltaQty: number;
  previousStock: number;
  newStock: number;
  binCode: string;
  operator: string;
  digitalProofHash: string;
  notes?: string;
}

export type { StockAuditLogItem } from '@/features/admin/stock';
