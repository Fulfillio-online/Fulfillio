export type PackingStatus = 'READY_TO_PACK' | 'PACKED';
export type CourierProvider = 'Steadfast' | 'Pathao' | 'RedX';
export type MerchantCode = 'MC-101' | 'MC-102' | 'MC-103';

export interface PackingOrderItem {
  sku: string;
  title: string;
  color: string;
  size: string;
  qty: number;
  price: number;
}

export interface PackingOrder {
  id: string;
  merchantCode: MerchantCode;
  merchantName: string;
  memoCode: string;
  resellerName: string;
  resellerPhone: string;
  resellerAddress: string;
  brandColor: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  courier: CourierProvider;
  consignmentId: string;
  trackingCode: string;
  packagingType: string;
  codAmount: number;
  status: PackingStatus;
  pickedRack: string;
  packedAt?: string;
  items: PackingOrderItem[];
}
