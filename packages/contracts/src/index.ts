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

export enum CourierConnectionStatus {
  CONNECTED = 'CONNECTED',
  SANDBOX = 'SANDBOX',
  DISCONNECTED = 'DISCONNECTED',
}

export interface CourierIntegrationSummaryDto {
  id: string;
  provider: CourierProvider;
  displayName: string;
  status: CourierConnectionStatus;
  isSandbox: boolean;
  baseUrl: string;
  storeId?: string | null;
  webhookUrl: string;
  hasWebhookSecret: boolean;
  webhookSecretMasked?: string | null;
  hasCredentials: boolean;
  credentialsMasked: Record<string, string>;
  codChargePercent: number;
  insideDhakaRate: number;
  outsideDhakaRate: number;
  autoBookingEnabled: boolean;
  allowPipelineOverride: boolean;
  activeConsignments: number;
  lastHealthStatus?: string | null;
  lastLatencyMs?: number | null;
  lastBalance?: number | null;
  lastCheckedAt?: string | null;
  lastError?: string | null;
  updatedAt: string;
}

export interface CourierTestConnectionResponse {
  provider: CourierProvider;
  success: boolean;
  reachable: boolean;
  authenticated: boolean;
  latencyMs: number;
  balance?: number | null;
  currency?: string;
  statusCode?: number;
  message: string;
  checkedAt: string;
}

export interface CourierBookingResultDto {
  orderId: string;
  provider: CourierProvider;
  consignmentId: string;
  trackingCode: string;
  trackingLink?: string | null;
  deliveryStatus?: string | null;
  isSimulated: boolean;
}

export interface CourierBulkBookingItemDto {
  orderId: string;
  invoice: string;
  success: boolean;
  consignmentId?: string | null;
  trackingCode?: string | null;
  trackingLink?: string | null;
  deliveryStatus?: string | null;
  error?: string | null;
  isSimulated?: boolean;
}

export interface CourierBulkBookingResponseDto {
  provider: CourierProvider;
  total: number;
  succeeded: number;
  failed: number;
  results: CourierBulkBookingItemDto[];
}

export interface CourierStatusSyncResponseDto {
  orderId: string;
  provider: CourierProvider;
  consignmentId?: string | null;
  trackingCode?: string | null;
  rawStatus: string;
  mappedOrderStatus?: OrderStatus | null;
  orderStatusUpdated: boolean;
  syncedAt: string;
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

// ============================================================================
// DYNAMIC EARNINGS, RETURN-WINDOW HOLD, CLAIM STAGE & DIGITAL-PROOF PAYOUTS
// ============================================================================

export enum OrderEarningStatus {
  PENDING = 'PENDING',
  READY_TO_CLAIM = 'READY_TO_CLAIM',
  CLAIMED = 'CLAIMED',
  REFUNDED = 'REFUNDED',
}

export enum PayoutMethod {
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
}

export enum PayoutRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface OrderEarningDto {
  id: string;
  transactionRef: string;
  merchantId: string;
  merchantCode?: string;
  merchantName?: string;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  itemSummary: string;
  grossAmount: number;
  deliveryFee: number;
  handlingFee: number;
  packagingFee: number;
  feeAmount: number;
  netAmount: number;
  status: OrderEarningStatus;
  returnWindowDays: number;
  completedAt: string;
  claimableAt: string;
  claimedAt?: string;
  refundedAt?: string;
  refundReason?: string;
  releasedByAdmin: boolean;
  remainingMs: number;
  isReturnWindowOver: boolean;
}

export interface PayoutDigitalProofDto {
  trxId: string;
  proofDocumentUrl: string;
  proofDocumentName?: string;
  proofDocumentMime?: string;
  proofChannel?: string;
  proofNotes?: string;
  proofChecksum?: string;
  paidAt?: string;
  paidByAdminName?: string;
}

export interface PayoutRequestDto {
  id: string;
  requestCode: string;
  merchantId: string;
  merchantCode: string;
  merchantName: string;
  ownerName: string;
  amount: number;
  method: PayoutMethod;
  provider: string;
  accountNumber: string;
  accountHolder?: string;
  branchName?: string;
  routingNumber?: string;
  remarks?: string;
  status: PayoutRequestStatus;
  rejectionReason?: string;
  requestedAt: string;
  reviewedAt?: string;
  trxId?: string;
  proofDocumentUrl?: string;
  proofDocumentName?: string;
  proofDocumentMime?: string;
  proofChannel?: string;
  proofNotes?: string;
  proofChecksum?: string;
  paidAt?: string;
  paidByAdminName?: string;
}

export type EarningsChartPeriod = 'THIS_MONTH' | 'LAST_30_DAYS' | 'LAST_6_MONTHS' | 'ALL_TIME';

export interface EarningsChartBucketDto {
  label: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  ordersCount: number;
}

export interface MerchantEarningsDashboardDto {
  merchant: {
    id: string;
    merchantCode: string;
    businessName: string;
    ownerName: string;
    returnWindowDays: number;
    minPayoutAmount: number;
    baseHandlingFee: number;
    payoutAccount?: Record<string, any> | null;
  };
  summary: {
    availableBalance: number;
    readyToClaim: number;
    withdrawableTotal: number;
    pendingEarnings: number;
    totalClaimed: number;
    upcomingPayout: number;
    totalPaidOut: number;
    totalRefunded: number;
    clawbackDeficit: number;
    totalGrossEarnings: number;
    totalDeliveryFees: number;
    totalHandlingFees: number;
    totalPackagingFees: number;
    totalPlatformFees: number;
    totalNetEarnings: number;
    completedOrdersCount: number;
    pendingCount: number;
    readyToClaimCount: number;
    claimedCount: number;
    refundedCount: number;
    paidPayoutsCount: number;
    nextScheduledPayoutDate: string;
  };
  chart: {
    period: EarningsChartPeriod;
    buckets: EarningsChartBucketDto[];
    periodGross: number;
    periodDeliveryFees: number;
    periodHandlingAndPackagingFees: number;
    periodPlatformFees: number;
    periodRefunded: number;
    periodNet: number;
  };
  earnings: OrderEarningDto[];
  payoutRequests: PayoutRequestDto[];
}

export enum FinanceEntryType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export enum FinanceEntryCategory {
  RENT = 'RENT',
  SALARY = 'SALARY',
  COURIER_COST = 'COURIER_COST',
  PACKAGING_PURCHASE = 'PACKAGING_PURCHASE',
  UTILITY_MISC = 'UTILITY_MISC',
  STORAGE_FEE = 'STORAGE_FEE',
  OTHER_INCOME = 'OTHER_INCOME',
}

export type FinanceTimeframePreset =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'THIS_MONTH'
  | 'LAST_30_DAYS'
  | 'ALL_TIME'
  | 'CUSTOM';

export interface CompanyFinanceEntryDto {
  id: string;
  entryCode: string;
  type: FinanceEntryType;
  category: FinanceEntryCategory;
  title: string;
  amount: number;
  entryDate: string;
  merchantId?: string | null;
  merchantCode?: string | null;
  merchantName?: string | null;
  paymentMethod?: string | null;
  referenceNo?: string | null;
  notes?: string | null;
  createdByAdminId?: string | null;
  createdByAdminName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceAnalyticsExpenseCategoryDto {
  category: FinanceEntryCategory;
  label: string;
  amount: number;
  sharePercentage: number;
  entriesCount: number;
}

export interface FinanceAnalyticsRevenueStreamDto {
  id: string;
  label: string;
  source: 'AUTO_ORDER_FEE' | 'MANUAL_LEDGER';
  amount: number;
  sharePercentage: number;
}

export interface FinanceTimeSeriesBucketDto {
  label: string;
  dateKey: string;
  totalOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  grossCod: number;
  revenue3pl: number;
  expenses: number;
  netProfit: number;
}

export interface FinanceMerchantBreakdownDto {
  merchantId: string;
  merchantCode: string;
  merchantName: string;
  ownerName: string;
  totalOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  grossCodCollected: number;
  handlingFees: number;
  packagingFees: number;
  deliveryFees: number;
  total3plFees: number;
  merchantNetEarned: number;
  totalPaidOut: number;
  currentUnpaidDue: number;
  pendingPayoutCount: number;
}

export interface AdminFinanceAnalyticsDto {
  filter: {
    preset: FinanceTimeframePreset;
    startDate: string;
    endDate: string;
    label: string;
    merchantId?: string | null;
    merchantCode?: string | null;
    merchantName?: string | null;
  };
  merchantsList: Array<{
    id: string;
    merchantCode: string;
    businessName: string;
  }>;
  codSettlement: {
    totalOrderBillCollected: number;
    totalPlatformFeesDeducted: number;
    deliveryFeesDeducted: number;
    handlingAndPackagingDeducted: number;
    merchantNetPayable: number;
    deliveredOrdersInPeriod: number;
    totalPaidToMerchants: number;
    allTimePaidToMerchants: number;
    pendingReturnWindowHold: number;
    readyToClaimAndWalletBalance: number;
    pendingPayoutRequestsAmount: number;
    pendingPayoutRequestsCount: number;
    totalUnpaidMerchantLiability: number;
  };
  companyProfitLoss: {
    isMerchantScoped: boolean;
    autoHandlingRevenue: number;
    autoPackagingRevenue: number;
    autoDeliveryFeeRevenue: number;
    autoOrderFeeRevenue: number;
    manualStorageIncome: number;
    manualOtherIncome: number;
    gross3plRevenue: number;
    totalOperatingExpenses: number;
    netProfit: number;
    netMarginPercentage: number;
    isProfitable: boolean;
    revenueStreams: FinanceAnalyticsRevenueStreamDto[];
    expensesByCategory: FinanceAnalyticsExpenseCategoryDto[];
  };
  orderVolume: {
    totalOrders: number;
    deliveredOrders: number;
    dispatchedInTransitOrders: number;
    pendingAndProcessingOrders: number;
    returnedOrders: number;
    cancelledOrders: number;
    deliverySuccessRate: number;
    returnRate: number;
    returnedOrderValue: number;
    buckets: FinanceTimeSeriesBucketDto[];
  };
  merchantBreakdown: FinanceMerchantBreakdownDto[];
  ledgerEntries: CompanyFinanceEntryDto[];
}

export interface AdminOperationsCourierDto {
  provider: string;
  label: string;
  totalParcels: number;
  sharePercentage: number;
  deliveredCount: number;
  inTransitCount: number;
  returnedCount: number;
  deliverySuccessRate: number;
  returnRate: number;
  codInTransitAmount: number;
  status: 'optimal' | 'healthy' | 'delayed';
}

export interface AdminOperationsZoneCapacityDto {
  zoneId: string;
  zone: string;
  binCount: number;
  skuCount: number;
  availableUnits: number;
  reservedUnits: number;
  damagedUnits: number;
  totalUnits: number;
  reorderAlerts: number;
}

export interface AdminOperationsActivityDto {
  id: string;
  title: string;
  details: string;
  type: 'order' | 'inbound' | 'payout' | 'merchant' | 'inventory' | 'system';
  createdAt: string;
}

export interface AdminOperationsDashboardDto {
  generatedAt: string;
  pipeline: {
    pendingAndProcessingCount: number;
    pendingCount: number;
    onHoldCount: number;
    pickingAndAllocatedCount: number;
    packedAndReadyCount: number;
    dispatchedInTransitCount: number;
    deliveredTodayCount: number;
    totalDeliveredAllTime: number;
    returnedAndCancelledCount: number;
    returnedCount: number;
    cancelledCount: number;
    totalOrdersAllTime: number;
    deliverySuccessRate: number;
  };
  actionCenter: {
    pendingMerchantsCount: number;
    pendingProductApprovalsCount: number;
    pendingRestockRequestsCount: number;
    pendingPayoutRequestsCount: number;
    pendingPayoutRequestsAmount: number;
    pendingReturnRequestsCount: number;
    totalActionItems: number;
  };
  couriers: AdminOperationsCourierDto[];
  warehouseCapacity: {
    totalBins: number;
    totalSkusInStock: number;
    totalAvailableUnits: number;
    totalReservedUnits: number;
    totalDamagedUnits: number;
    zones: AdminOperationsZoneCapacityDto[];
  };
  recentActivity: AdminOperationsActivityDto[];
}

