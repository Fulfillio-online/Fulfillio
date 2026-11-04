export type DeliveryTrackingStatus = 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';
export type CourierPartner = 'Steadfast' | 'Pathao' | 'RedX';

export interface DispatchedOrderRecord {
  id: string;
  dispatchedAt: string;
  merchantCode: string;
  merchantName: string;
  productTitle: string;
  fullSku: string;
  qtySent: number;
  customerName: string;
  customerPhone: string;
  city: string;
  courier: CourierPartner;
  trackingCode: string;
  codAmount: number;
  status: DeliveryTrackingStatus;
}

export interface DeliveryKpiData {
  totalOrders: number;
  totalProductsSent: number;
  inTransitCount: number;
  deliveredCount: number;
  returnedCount: number;
  deliverySuccessRate: number;
}

export interface MerchantSummaryRow {
  code: string;
  name: string;
  dispatchedOrders: number;
  totalQty: number;
  inTransit: number;
  delivered: number;
  returned: number;
  totalCodValue: number;
}
