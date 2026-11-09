export type MerchantSubTab = 'overview' | 'profile' | 'memo' | 'orders' | 'products' | 'payout';
export type OrderPeriodFilter = 'DAY' | 'WEEK' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
export type OverviewRangeFilter = OrderPeriodFilter;

export const PERIOD_RANK: Record<OrderPeriodFilter, number> = {
  DAY: 1,
  WEEK: 2,
  '1M': 3,
  '3M': 4,
  '6M': 5,
  '1Y': 6,
  ALL: 7,
};

export const PERIOD_FILTER_OPTIONS: { id: OrderPeriodFilter; label: string; periodLabel: string }[] = [
  { id: 'DAY', label: 'Day', periodLabel: 'today records' },
  { id: 'WEEK', label: 'Week', periodLabel: 'this week records' },
  { id: '1M', label: '1 Month', periodLabel: 'last 1 month' },
  { id: '3M', label: '3 Months', periodLabel: 'last 3 months' },
  { id: '6M', label: '6 Months', periodLabel: 'last 6 months' },
  { id: '1Y', label: '1 Year', periodLabel: 'last 1 year' },
  { id: 'ALL', label: 'All Time', periodLabel: 'all time records' },
];

export interface MerchantProductItem {
  id: string;
  merchantCode: string;
  title: string;
  category: 'Apparel' | 'Footwear' | 'Electronics' | 'Beauty';
  sku: string;
  barcode: string;
  color: string;
  size: string;
  price: number;
  wholesalePrice: number;
  stock: number;
  reserved: number;
  damaged: number;
  bin: string;
  imageUrl?: string;
}

export interface MerchantOrderItem {
  id: string;
  merchantCode: string;
  date: string;
  isoDate: string;
  periodBucket: OrderPeriodFilter;
  customer: string;
  phone: string;
  address: string;
  city: string;
  items: string;
  sku: string;
  qty: number;
  memoCode: string;
  courier: string;
  status: 'ALLOCATED' | 'PICKING' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  amount: number;
  fraudRatio: number;
}

export interface MerchantMemoItem {
  id: string;
  merchantCode: string;
  code: string;
  resellerName: string;
  brandColor: string;
  phone: string;
  address: string;
  terms: string;
  isDefault: boolean;
  logoUrl?: string;
}

export interface MerchantRecord {
  id: string;
  merchantCode: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  deliveryArea: string;
  status: 'Active' | 'Pending' | 'Suspended';
  verified: boolean;
  joinedDate: string;
  avatarInitials: string;
  avatarBg: string;
  avatarUrl?: string;
  payoutAccount: {
    provider: string;
    accountHolder: string;
    accountNumber: string;
    branchName: string;
    routingNumber: string;
    bkashNumber: string;
    frequency: string;
    status: 'VERIFIED' | 'PENDING_REVIEW';
    availableBalance: number;
    lastPayoutAmount: number;
  };
}
