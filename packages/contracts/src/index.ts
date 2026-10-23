/**
 * Fulfillio Shared Domain Contracts, Enums & Schemas
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MERCHANT = 'MERCHANT',
  WAREHOUSE_OPERATOR = 'WAREHOUSE_OPERATOR',
  COURIER_AGENT = 'COURIER_AGENT',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ALLOCATED = 'ALLOCATED',
  PICKING = 'PICKING',
  PACKED = 'PACKED',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export enum CourierProvider {
  STEADFAST = 'STEADFAST',
  PATHAO = 'PATHAO',
  REDX = 'REDX',
  PAPERFLY = 'PAPERFLY',
  CUSTOM = 'CUSTOM',
}

export enum MemoPaperSize {
  A4 = 'A4',
  A5 = 'A5',
  THERMAL_4X6 = 'THERMAL_4X6',
  POS_80MM = 'POS_80MM',
}

export interface MemoTemplateLayout {
  header: {
    showLogo: boolean;
    logoUrl?: string;
    storeName: string;
    phone?: string;
    address?: string;
  };
  fields: {
    showBarcode: boolean;
    showCustomerNotes: boolean;
    showSKU: boolean;
    showUnitPrice: boolean;
    showTaxTotal: boolean;
  };
  footer: {
    terms?: string;
    thankYouMessage?: string;
  };
  paperSize: MemoPaperSize;
}

export interface MemoTemplateDto {
  id: string;
  merchantId: string;
  memoCode: string;
  name: string;
  isDefault: boolean;
  layout: MemoTemplateLayout;
  createdAt: string;
  updatedAt: string;
}

export interface BarcodeScanResult {
  code: string;
  format?: string;
  timestamp: number;
}
