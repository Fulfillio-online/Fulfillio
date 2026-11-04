/**
 * Fulfillio Shared Domain Contracts, Enums & Schemas
 * Strict Single Source of Truth for Backend (NestJS) & Frontend (Next.js)
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MERCHANT = 'MERCHANT',
  RESELLER = 'RESELLER',
  WAREHOUSE_OPERATOR = 'WAREHOUSE_OPERATOR',
  COURIER_AGENT = 'COURIER_AGENT',
}

export enum MerchantStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ON_HOLD_STOCK = 'ON_HOLD_STOCK',
  ON_HOLD_FRAUD = 'ON_HOLD_FRAUD',
  ALLOCATED = 'ALLOCATED',
  PICKING = 'PICKING',
  PACKED = 'PACKED',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  PARTIAL_DELIVERED = 'PARTIAL_DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DAMAGED_QUARANTINE = 'DAMAGED_QUARANTINE',
}

export enum StockMovementReason {
  INBOUND_ASN = 'INBOUND_ASN',
  ORDER_RESERVED = 'ORDER_RESERVED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  RETURN_RESTOCK = 'RETURN_RESTOCK',
  DAMAGED_QUARANTINE = 'DAMAGED_QUARANTINE',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

export enum InboundShipmentStatus {
  DRAFT = 'DRAFT',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED_AT_DOCK = 'ARRIVED_AT_DOCK',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PackagingType {
  POLY_SMALL = 'POLY_SMALL',
  POLY_LARGE = 'POLY_LARGE',
  BOX_SMALL = 'BOX_SMALL',
  BOX_MEDIUM = 'BOX_MEDIUM',
  BOX_LARGE = 'BOX_LARGE',
  BUBBLE_WRAP = 'BUBBLE_WRAP',
}

export const PACKAGING_COSTS: Record<PackagingType, number> = {
  [PackagingType.POLY_SMALL]: 5,
  [PackagingType.POLY_LARGE]: 8,
  [PackagingType.BOX_SMALL]: 15,
  [PackagingType.BOX_MEDIUM]: 22,
  [PackagingType.BOX_LARGE]: 35,
  [PackagingType.BUBBLE_WRAP]: 10,
};

export enum FraudRiskLevel {
  SAFE = 'SAFE',
  MODERATE_RISK = 'MODERATE_RISK',
  HIGH_RISK_FRAUD = 'HIGH_RISK_FRAUD',
}

export interface CustomerFraudReport {
  phone: string;
  totalParcels: number;
  deliveredParcels: number;
  cancelledParcels: number;
  successRatio: number; // 0 to 100
  riskLevel: FraudRiskLevel;
  couriers: {
    steadfast: { delivered: number; cancelled: number };
    pathao: { delivered: number; cancelled: number };
    redx: { delivered: number; cancelled: number };
  };
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
    brandColor?: string;
    phone?: string;
    address?: string;
  };
  fields: {
    showBarcode: boolean;
    showCourierSlip: boolean;
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

export interface InboundShipmentItemDto {
  id?: string;
  variantId: string;
  sku: string;
  productTitle: string;
  expectedQuantity: number;
  receivedGoodQuantity: number;
  receivedDamagedQuantity: number;
  assignedBinCode?: string;
}

export interface InboundShipmentDto {
  id: string;
  asnCode: string;
  merchantId: string;
  merchantCode: string;
  merchantName: string;
  status: InboundShipmentStatus;
  carrierName: string;
  trackingReference?: string;
  expectedArrivalDate: string;
  receivedAt?: string;
  receivedByWorkerId?: string;
  items: InboundShipmentItemDto[];
  notes?: string;
  createdAt: string;
}

export interface BarcodeScanResult {
  code: string;
  format?: string;
  timestamp: number;
}
