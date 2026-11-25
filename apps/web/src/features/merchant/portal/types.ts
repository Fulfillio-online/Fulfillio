import type { ProductPendingEditInfo } from '@/lib/productRevision';

export type MerchantTab =
  | 'overview'
  | 'products'
  | 'stock-requests'
  | 'categories'
  | 'orders'
  | 'returns'
  | 'memo-designer'
  | 'inbound'
  | 'tracking'
  | 'billing'
  | 'api-keys'
  | 'profile';

export type VerificationStatus = 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED' | 'UNVERIFIED';

export interface MerchantSubcategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
}

export interface MerchantCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  subcategories: MerchantSubcategoryItem[];
  createdAt?: string;
}

export interface PayoutAccount {
  provider: string;
  accountHolder: string;
  accountNumber: string;
  branchName: string;
  routingNumber: string;
  frequency: string;
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED' | 'UNVERIFIED';
  chequeLeafUrl: string;
  bkashMerchantNumber?: string;
  rejectionReason?: string;
  submittedAt?: string;
  updatedAt?: string;
  verifiedAt?: string;
}

export interface KycDocumentData {
  tradeLicenseNo?: string;
  tradeLicenseDocUrl?: string;
  nidNumber?: string;
  nidDocUrl?: string;
  nidBackDocUrl?: string;
  selfieDocUrl?: string;
  verificationStatus: VerificationStatus;
  submittedAt?: string;
  verifiedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface SocialChannel {
  id: string;
  platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'WhatsApp';
  url: string;
}

export interface MerchantProfileData {
  id?: string;
  merchantCode: string;
  ownerName: string;
  storeName: string;
  email: string;
  phone: string;
  location: string;
  personalAddress?: string;
  logoUrl?: string;
  status: string;
  verified: boolean;
  payoutMethod: string;
  payoutSchedule: string;
  payoutAccount: PayoutAccount;
  kycData?: KycDocumentData;
  socialChannels: SocialChannel[];
  apiKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  baseHandlingFee?: number;
}

export interface ResellerMemo {
  id: string;
  code: string;
  name: string;
  resellerName: string;
  phone: string;
  address: string;
  note: string;
  accentColor?: string;
  color?: string;
  logoUrl?: string;
  paperSize: string;
  isDefault: boolean;
  created: string;
  merchantCode?: string;
  merchantName?: string;
  sampleItems?: { name: string; qty: number; price: string }[];
}

export interface OrderLineItem {
  id: string;
  productId?: string;
  variantId?: string;
  title: string;
  variant: string;
  color?: string;
  size?: string;
  sku: string;
  price: number;
  basePrice?: number;
  quantity: number;
  total: number;
  imageUrl?: string;
}

export interface OrderTimelineEvent {
  title: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
}

export interface MerchantOrderItem {
  id: string;
  orderNumber?: string;
  date: string;
  customer: string;
  phone: string;
  address: string;
  city?: string;
  customerInitials?: string;
  customerEmail?: string;
  productId: string;
  items: string;
  qty: number;
  amount: number;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  advancePayment?: number;
  codAmount?: number;
  memoCode: string;
  status: 'PENDING' | 'ALLOCATED' | 'PICKED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  courier: string;
  courierStatus?: string;
  trackingId?: string;
  consignmentId?: string;
  paymentMethod?: string;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Partial';
  advancePaymentMethod?: string;
  advanceTrxId?: string;
  transactionId?: string;
  lineItems?: OrderLineItem[];
  timeline?: OrderTimelineEvent[];
}

/**
 * An order cannot be cancelled once it is handed over to the courier (or is delivered, returned, or already cancelled).
 * Cancellation is ONLY permitted when the order is in warehouse stages:
 * PENDING, ALLOCATED, PICKING, PICKED, PROCESSING, PACKED.
 */
export function isOrderCancellable(status?: string, courierStatus?: string): boolean {
  if (!status) return false;
  const s = status.trim().toUpperCase();

  // Terminal & non-cancellable states
  if (s === 'CANCELLED' || s === 'DELIVERED' || s === 'RETURNED') {
    return false;
  }

  // Courier handover & in-transit states: strictly locked
  if (
    s === 'DISPATCHED' ||
    s === 'COURIER_BOOKED' ||
    s === 'HANDOVER' ||
    s === 'SHIPPED' ||
    s === 'IN_TRANSIT'
  ) {
    return false;
  }

  // Also check courierStatus if provided
  if (courierStatus) {
    const cs = courierStatus.trim().toUpperCase();
    if (
      cs.includes('HANDOVER') ||
      cs.includes('DISPATCH') ||
      cs.includes('PICKED_UP') ||
      cs.includes('TRANSIT') ||
      cs.includes('DELIVER')
    ) {
      return false;
    }
  }

  return true;
}

export interface MerchantProductItem {
  id: string;
  title: string;
  variantLabel: string;
  sku: string;
  barcode: string;
  stock: number;
  stockAccepted?: boolean;
  stockStatus?: 'AWAITING_STOCK' | 'IN_STOCK' | 'OUT_OF_STOCK';
  reserved: number;
  price: number;
  costPrice?: number;
  profit?: number;
  profitMargin?: number;
  bin: string;
  category?: string;
  subcategory?: string;
  productType?: 'FASHION' | 'ELECTRONICS' | 'BEAUTY' | 'GROCERY' | 'STANDARD';
  description?: string;
  minPrice?: number;
  maxPrice?: number;
  keyFeatures?: string[];
  colors?: { id: string; name: string; hex: string; imageUrl?: string; sizes?: string[]; originalName?: string }[];
  sizes?: string[];
  variantsList?: {
    id: string;
    variantSku: string;
    price?: number;
    color?: string;
    originalColor?: string;
    size?: string;
    originalSize?: string;
    imageUrl?: string;
    attributeName?: string;
    attributeValue?: string;
    stock: number;
  }[];
  imageUrl?: string;
  images?: string[];
  status?: 'PUBLISHED' | 'STOCK_STORED' | 'APPROVED' | 'DRAFT' | 'ARCHIVED' | 'PENDING_APPROVAL' | 'REJECTED';
  isDraft?: boolean;
  totalOrders?: number;
  editState?: 'NONE' | 'EDIT_REQUESTED' | 'EDIT_ALLOWED' | 'EDIT_APPROVAL_PENDING' | 'EDIT_ACCESS_REQUESTED' | null;
  pendingEdit?: ProductPendingEditInfo | null;
  lastEditRejectionReason?: string;
  isSuspended?: boolean;
  rejectionReason?: string;
}

export interface MerchantAsnItem {
  sku: string;
  title: string;
  expectedQty: number;
  receivedGoodQty: number;
  receivedDamagedQty: number;
  binCode?: string;
}

export interface MerchantAsnRecord {
  id: string;
  asnCode: string;
  carrierName: string;
  trackingRef: string;
  expectedArrivalDate: string;
  status: 'DRAFT' | 'IN_TRANSIT' | 'ARRIVED_AT_DOCK' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  items: MerchantAsnItem[];
  createdAt: string;
}

export interface MerchantWebhookLog {
  id: string;
  event: string;
  endpoint: string;
  status: 'SUCCESS' | 'FAILED';
  httpCode: number;
  payloadSummary: string;
  timestamp: string;
}
