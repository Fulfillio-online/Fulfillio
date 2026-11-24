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

// ============================================================================
// WMS PRODUCT LIFECYCLE & INVENTORY APPROVAL WORKFLOW
// ============================================================================

export enum ProductLifecycleStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  AWAITING_STOCK = 'AWAITING_STOCK',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum ProductEditState {
  NONE = 'NONE',
  EDIT_REQUESTED = 'EDIT_REQUESTED',
  EDIT_ALLOWED = 'EDIT_ALLOWED',
  EDIT_APPROVAL_PENDING = 'EDIT_APPROVAL_PENDING',
}

export enum ApprovalRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum EditRequestType {
  EDIT_PERMISSION = 'EDIT_PERMISSION',
  REVISION_APPROVAL = 'REVISION_APPROVAL',
}

export enum RestockRequestStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ReturnRequestStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PARTIALLY_DISPATCHED = 'PARTIALLY_DISPATCHED',
  DISPATCHED = 'DISPATCHED',
  CANCELLED = 'CANCELLED',
}

export enum InventoryTransactionType {
  INITIAL_STOCK_IN = 'INITIAL_STOCK_IN',
  RESTOCK_IN = 'RESTOCK_IN',
  RETURN_TO_MERCHANT = 'RETURN_TO_MERCHANT',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  ORDER_RESERVED = 'ORDER_RESERVED',
  ORDER_FULFILLED = 'ORDER_FULFILLED',
  ORDER_RELEASED = 'ORDER_RELEASED',
}

export enum ThermalStickerSize {
  SIZE_40X30 = '40x30mm',
  SIZE_50X30 = '50x30mm',
}

export interface CreateProductDto {
  title: string;
  description?: string;
  baseSku: string;
  category?: string;
  brand?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  weight?: string;
  dimensions?: string;
  imageUrl?: string;
  images?: string[];
  saveAsDraft?: boolean;
  variants?: Array<{
    title: string;
    variantCode?: string;
    sku?: string;
    barcode?: string;
    price: number;
    wholesalePrice?: number;
    defaultBinCode?: string;
    imageUrl?: string;
    attributes?: Record<string, any>;
  }>;
}

export interface ProductApprovalRequestDto {
  id: string;
  productId: string;
  merchantId: string;
  merchantCode?: string;
  merchantName?: string;
  productTitle?: string;
  productSku?: string;
  productImage?: string;
  sellingPrice?: number;
  requestedBy?: string;
  status: ApprovalRequestStatus;
  adminId?: string;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface StockReceivingDto {
  productId: string;
  variantId?: string;
  expectedQuantity: number;
  actualQuantity: number;
  acceptedQuantity: number;
  damagedQuantity: number;
  warehouseLocation?: string;
  binCode: string;
  receivingNotes?: string;
  receivedBy?: string;
}

export interface RequestProductEditDto {
  productId: string;
  reason?: string;
  proposedChanges?: Record<string, any>;
}

export interface SubmitProductRevisionDto {
  productId: string;
  reason?: string;
  proposedSnapshot: {
    title?: string;
    description?: string;
    sku?: string;
    baseSku?: string;
    category?: string;
    subcategory?: string;
    productType?: string;
    price?: number;
    costPrice?: number;
    purchasePrice?: number;
    sellingPrice?: number;
    weight?: string;
    dimensions?: string;
    imageUrl?: string;
    images?: string[];
    keyFeatures?: string[];
    colors?: Array<{
      id: string;
      name: string;
      hex: string;
      imageUrl?: string;
      sizes?: string[];
      originalName?: string;
    }>;
    sizes?: string[];
    variantsList?: any[];
    variants?: any[];
  };
}

export interface CreateRestockRequestDto {
  productId: string;
  requestedQuantity: number;
  estimatedDeliveryDate?: string;
  notes?: string;
}

export interface CreateReturnRequestDto {
  productId: string;
  requestedQuantity: number;
  returnReason: string;
  notes?: string;
}

export interface InventoryTransactionDto {
  id: string;
  productId: string;
  merchantId: string;
  locationId?: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  performedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface ActivityLogDto {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  notes?: string;
  createdAt: string;
}

export interface InAppNotificationDto {
  id: string;
  recipientRole: UserRole;
  recipientUserId?: string;
  merchantId?: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

