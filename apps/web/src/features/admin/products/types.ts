export type WarehouseProductSubTab = 'all' | 'approval' | 'bins' | 'ledger' | 'public' | 'out_of_stock' | 'draft' | 'ALL' | 'APPROVAL' | 'PUBLIC' | 'OUT_OF_STOCK' | 'DRAFT' | string;

export type InboundApprovalType = 'NEW_PRODUCT' | 'RESTOCK' | 'WITHDRAWAL';

export type StockMovementType = 'INITIAL_INTAKE' | 'RESTOCK' | 'WITHDRAWAL' | 'AUDIT_ADJUSTMENT';

export interface StockMovementRecord {
  id: string; // e.g. 'PRF-2026-9041'
  timestamp: string; // e.g. '2026-11-10 10:30'
  type: StockMovementType;
  merchantCode: string;
  merchantName: string;
  productId: string;
  productTitle: string;
  sku: string;
  deltaQty: number; // +50, -30, etc.
  previousStock: number;
  newStock: number;
  binCode: string;
  referenceDocType: 'INWARD_CHALLAN' | 'GATE_PASS' | 'MERCHANT_RECALL' | 'INTERNAL_AUDIT' | 'COURIER_POD';
  referenceNumber: string; // e.g. 'CHL-89102' or 'GP-44109' or 'STEAD-991823'
  digitalProofHash: string; // e.g. 'FL-SHA256-8F92A1'
  operator: string; // e.g. 'Rahim Uddin (Lead Inbound)'
  carrierOrCourier?: string; // e.g. 'Steadfast Courier'
  driverOrRepName?: string; // e.g. 'Md. Karim (ID: DL-8819)'
  notes?: string;
  verifiedAt: string;
}

export interface WarehouseBin {
  code: string;
  description: string;
  zone: string;
  capacityUnits: number;
  createdAt: string;
}

export interface MerchantInfo {
  code: string;
  name: string;
  categoryFocus: string;
}

export interface WarehouseProductItem {
  id: string;
  title: string;
  category: 'Fashion' | 'Apparel' | 'Footwear' | 'Electronics' | 'Accessories' | string;
  merchantCode: string;
  merchantName: string;
  shortSku: string;
  fullSku: string;
  color: string;
  size: string;
  binCode: string;
  stock: number;
  price: number;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED' | 'DRAFT';
  isDraft?: boolean;
  submittedAt: string;
  imageUrl: string;
  barcode?: string;
  description?: string;
  colors?: { id: string; name: string; hex: string; imageUrl?: string; sizes?: string[] }[];
  sizes?: string[];
  variantsList?: {
    id: string;
    variantSku: string;
    color?: string;
    size?: string;
    attributeName?: string;
    attributeValue?: string;
    stock: number;
  }[];
}

export interface InboundStockReplenishment {
  id: string;
  productId: string;
  productTitle: string;
  productSku: string;
  merchantCode: string;
  merchantName: string;
  category: 'Fashion' | 'Apparel' | 'Footwear' | 'Electronics' | 'Accessories' | string;
  currentStock: number;
  requestedQty: number;
  binCode: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  note?: string;
  trackingRef?: string;
  submittedAt: string;
  imageUrl: string;
}

export interface StockWithdrawalRequest {
  id: string;
  productId: string;
  productTitle: string;
  productSku: string;
  merchantCode: string;
  merchantName: string;
  category: 'Fashion' | 'Apparel' | 'Footwear' | 'Electronics' | 'Accessories' | string;
  currentStock: number;
  withdrawQty: number;
  binCode: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  reason?: string;
  destination?: string;
  gatePassNo?: string;
  trackingRef?: string;
  submittedAt: string;
  imageUrl: string;
}

export interface UnifiedApprovalItem {
  id: string;
  approvalType: InboundApprovalType;
  productId?: string;
  title: string;
  category: 'Fashion' | 'Apparel' | 'Footwear' | 'Electronics' | 'Accessories' | string;
  merchantCode: string;
  merchantName: string;
  sku: string;
  color?: string;
  size?: string;
  currentStock: number;
  inboundQty: number;
  binCode: string;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED' | 'DRAFT';
  submittedAt: string;
  imageUrl: string;
  note?: string;
  trackingRef?: string;
  price?: number;
  rawProduct?: WarehouseProductItem;
  rawReplenishment?: InboundStockReplenishment;
  rawWithdrawal?: StockWithdrawalRequest;
}

export interface ProductPresetThumbnail {
  id: string;
  name: string;
  category: string;
  url: string;
}
