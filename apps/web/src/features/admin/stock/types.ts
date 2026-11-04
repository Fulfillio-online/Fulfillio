export type StockAdjustmentType =
  | 'RTO_RESTOCK'
  | 'CYCLE_SURPLUS'
  | 'DAMAGE_WRITEOFF'
  | 'MANUAL_RESTOCK';

export interface StockAuditLogItem {
  id: string;
  timestamp: string;
  merchantCode: string;
  fullSku: string;
  productTitle: string;
  binCode: string;
  deltaQty: number;
  previousStock: number;
  newStock: number;
  type: StockAdjustmentType;
  reason: string;
  referenceId: string;
}
