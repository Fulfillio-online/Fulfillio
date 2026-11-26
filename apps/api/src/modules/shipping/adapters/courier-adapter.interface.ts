import { CourierProvider, OrderStatus } from '@fulfillio/contracts';

export interface CourierRuntimeConfig {
  provider: CourierProvider;
  baseUrl: string;
  isSandbox: boolean;
  storeId?: string | null;
  webhookSecret?: string | null;
  credentials: Record<string, string>;
}

export interface CourierBookOrderInput {
  orderId: string;
  invoice: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number;
  note?: string;
  alternativePhone?: string;
  recipientEmail?: string;
  itemDescription?: string;
  totalLot?: number;
  deliveryType?: 0 | 1;
  exchange?: boolean;
  city?: string | null;
  weightKg?: number;
}

export interface CourierBookOrderOutput {
  consignmentId: string;
  trackingCode: string;
  trackingLink?: string | null;
  deliveryStatus?: string | null;
  rawResponse?: any;
}

export interface CourierBulkBookItemOutput {
  orderId: string;
  invoice: string;
  success: boolean;
  consignmentId?: string | null;
  trackingCode?: string | null;
  trackingLink?: string | null;
  deliveryStatus?: string | null;
  error?: string | null;
}

export interface CourierConnectionTestOutput {
  success: boolean;
  reachable: boolean;
  authenticated: boolean;
  latencyMs: number;
  balance?: number | null;
  currency?: string;
  statusCode?: number;
  message: string;
}

export interface CourierStatusOutput {
  rawStatus: string;
  mappedOrderStatus: OrderStatus | null;
  isFinalSettlementStatus: boolean;
  rawResponse?: any;
}

export interface CourierTrackingStep {
  timestamp: string;
  text: string;
  trackingType?: number | string;
}

export interface CourierReturnRequestInput {
  consignmentId?: string | null;
  invoice?: string | null;
  trackingCode?: string | null;
  reason?: string;
}

export interface CourierReturnRequestOutput {
  id: string;
  consignmentId?: string | null;
  status: string;
  reason?: string | null;
  rawResponse?: any;
}

export interface CourierWebhookVerification {
  valid: boolean;
  reason?: string;
}

export interface ParsedCourierWebhookEvent {
  notificationType: string;
  consignmentId?: string | null;
  invoice?: string | null;
  trackingCode?: string | null;
  rawStatus?: string | null;
  mappedOrderStatus: OrderStatus | null;
  isFinalSettlementStatus: boolean;
  trackingMessage?: string | null;
  codAmount?: number | null;
  deliveryCharge?: number | null;
  updatedAt?: string | null;
  rawPayload: any;
}

export interface CourierAdapter {
  readonly provider: CourierProvider;
  readonly displayName: string;
  readonly defaultBaseUrl: string;
  readonly requiredCredentialFields: string[];

  testConnection(config: CourierRuntimeConfig): Promise<CourierConnectionTestOutput>;
  getBalance?(config: CourierRuntimeConfig): Promise<{ balance: number; currency: string }>;
  bookOrder(config: CourierRuntimeConfig, input: CourierBookOrderInput): Promise<CourierBookOrderOutput>;
  bookBulkOrders(
    config: CourierRuntimeConfig,
    inputs: CourierBookOrderInput[],
  ): Promise<CourierBulkBookItemOutput[]>;
  getDeliveryStatus(
    config: CourierRuntimeConfig,
    ref: { consignmentId?: string | null; invoice?: string | null; trackingCode?: string | null },
  ): Promise<CourierStatusOutput>;
  getTrackingHistory?(
    config: CourierRuntimeConfig,
    ref: { consignmentId?: string | null; invoice?: string | null; trackingCode?: string | null },
  ): Promise<CourierTrackingStep[]>;
  createReturnRequest?(
    config: CourierRuntimeConfig,
    input: CourierReturnRequestInput,
  ): Promise<CourierReturnRequestOutput>;
  verifyWebhook(
    config: CourierRuntimeConfig,
    rawBody: Buffer | string | undefined,
    headers: Record<string, string | string[] | undefined>,
  ): CourierWebhookVerification;
  parseWebhook(payload: any): ParsedCourierWebhookEvent;
}
