export type MerchantTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'memo-designer'
  | 'tracking'
  | 'billing'
  | 'api-keys'
  | 'profile';

export interface PayoutAccount {
  provider: string;
  accountHolder: string;
  accountNumber: string;
  branchName: string;
  routingNumber: string;
  frequency: string;
  status: 'VERIFIED' | 'PENDING_REVIEW';
  chequeLeafUrl: string;
}

export interface SocialChannel {
  id: string;
  platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'WhatsApp';
  url: string;
}

export interface MerchantProfileData {
  merchantCode: string;
  ownerName: string;
  storeName: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  verified: boolean;
  payoutMethod: string;
  payoutSchedule: string;
  payoutAccount: PayoutAccount;
  socialChannels: SocialChannel[];
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
