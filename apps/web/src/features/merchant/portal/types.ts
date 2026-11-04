export type MerchantTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'memo-designer'
  | 'inbound'
  | 'tracking'
  | 'billing'
  | 'api-keys'
  | 'profile';

export type VerificationStatus = 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED' | 'UNVERIFIED';

export interface PayoutAccount {
  provider: string;
  accountHolder: string;
  accountNumber: string;
  branchName: string;
  routingNumber: string;
  frequency: string;
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED';
  chequeLeafUrl: string;
  bkashMerchantNumber?: string;
}

export interface KycDocumentData {
  tradeLicenseNo?: string;
  tradeLicenseDocUrl?: string;
  nidNumber?: string;
  nidDocUrl?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
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
}

export interface ResellerMemo {
  id: string;
  code: string;
  name: string;
  resellerName: string;
  phone: string;
  address: string;
  note: string;
  accentColor: string;
  paperSize: string;
  isDefault: boolean;
  created: string;
}

export interface MerchantOrderItem {
  id: string;
  date: string;
  customer: string;
  phone: string;
  address: string;
  productId: string;
  items: string;
  qty: number;
  amount: number;
  memoCode: string;
  status: 'PENDING' | 'ALLOCATED' | 'PICKED' | 'PACKED' | 'DISPATCHED' | 'CANCELLED';
  courier: string;
}

export interface MerchantProductItem {
  id: string;
  title: string;
  variantLabel: string;
  sku: string;
  barcode: string;
  stock: number;
  reserved: number;
  price: number;
  bin: string;
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
