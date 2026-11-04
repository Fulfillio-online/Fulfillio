export type CourierName = 'Steadfast' | 'Pathao' | 'RedX' | 'Paperfly';

export type CourierDeliveryStatus =
  | 'PENDING'
  | 'PICKUP_REQUESTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'PARTIAL_DELIVERED'
  | 'RETURNED_TO_ORIGIN'
  | 'CANCELLED';

export interface TrackingCheckpoint {
  timestamp: string;
  status: CourierDeliveryStatus;
  statusLabel: string;
  location: string;
  notes: string;
  operator?: string;
}

export interface ConsignmentRequest {
  orderId: string;
  merchantCode: string;
  courier: CourierName;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  codAmount: number;
  itemWeightKg?: number;
  notes?: string;
}

export interface ConsignmentRecord {
  consignmentId: string;
  trackingCode: string;
  orderId: string;
  merchantCode: string;
  courier: CourierName;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  codAmount: number;
  deliveryCharge: number;
  codFee: number;
  netPayout: number;
  status: CourierDeliveryStatus;
  createdAt: string;
  updatedAt: string;
  checkpoints: TrackingCheckpoint[];
}

export interface CourierSettlementSummary {
  courier: CourierName;
  totalConsignments: number;
  totalCodCollected: number;
  totalDeliveryFee: number;
  totalCodFee: number;
  netPayableToMerchant: number;
  settlementStatus: 'PENDING' | 'SETTLED' | 'PROCESSING';
}

export interface CourierWebhookSimulationPayload {
  event: string;
  consignment_id: string;
  tracking_code: string;
  status: CourierDeliveryStatus;
  cod_amount: number;
  collected_amount: number;
  timestamp: string;
  signature: string;
}
