export type WmsStage = 'READY_TO_PICK' | 'PICKED' | 'PACKED' | 'BOOKED' | 'DISPATCHED';

export interface WmsOrder {
  id: string;
  date: string;
  customer: string;
  phone: string;
  address: string;
  city: string;
  itemTitle: string;
  variant: string;
  sku: string;
  bin: string;
  qty: number;
  memoCode: string;
  reseller: string;
  courier: 'Steadfast' | 'Pathao' | 'RedX' | string;
  amount: number;
  stage: WmsStage;
  packagingType?: string;
  trackingNumber?: string;
  selected?: boolean;
  packedAt?: string;
  bookedAt?: string;
  dispatchedAt?: string;
}

export interface WmsStationProfile {
  stationId: string;
  stationName: string;
  zone: string;
  operatorId: string;
  operatorName: string;
  shift: string;
}
