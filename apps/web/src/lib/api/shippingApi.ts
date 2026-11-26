import { fetchApi } from './client';
import type {
  CourierBookingResultDto,
  CourierBulkBookingResponseDto,
  CourierConnectionStatus,
  CourierIntegrationSummaryDto,
  CourierProvider,
  CourierStatusSyncResponseDto,
  CourierTestConnectionResponse,
} from '@fulfillio/contracts';

export interface UpsertCourierIntegrationPayload {
  displayName?: string;
  status?: CourierConnectionStatus | 'CONNECTED' | 'SANDBOX' | 'DISCONNECTED';
  isSandbox?: boolean;
  baseUrl?: string;
  storeId?: string | null;
  webhookSecret?: string | null;
  credentials?: Record<string, string>;
  codChargePercent?: number;
  insideDhakaRate?: number;
  outsideDhakaRate?: number;
  autoBookingEnabled?: boolean;
  allowPipelineOverride?: boolean;
}

export const shippingApi = {
  /**
   * List all platform courier integrations (Steadfast, Pathao, RedX)
   */
  listIntegrations: (): Promise<CourierIntegrationSummaryDto[]> => {
    return fetchApi<CourierIntegrationSummaryDto[]>('/shipping/integrations');
  },

  /**
   * Save courier credentials (encrypted in DB) and configuration
   */
  saveIntegration: (
    provider: CourierProvider | string,
    payload: UpsertCourierIntegrationPayload,
  ): Promise<CourierIntegrationSummaryDto> => {
    return fetchApi<CourierIntegrationSummaryDto>(
      `/shipping/integrations/${encodeURIComponent(provider)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
  },

  /**
   * Run live API handshake + balance check against courier
   */
  testConnection: (provider: CourierProvider | string): Promise<CourierTestConnectionResponse> => {
    return fetchApi<CourierTestConnectionResponse>(
      `/shipping/integrations/${encodeURIComponent(provider)}/test`,
      { method: 'POST' },
    );
  },

  /**
   * Fetch live withdrawable balance from courier (e.g. Steadfast /get_balance)
   */
  getBalance: (provider: CourierProvider | string): Promise<{
    provider: CourierProvider;
    balance: number;
    currency: string;
    checkedAt: string;
  }> => {
    return fetchApi(`/shipping/integrations/${encodeURIComponent(provider)}/balance`);
  },

  /**
   * Synchronous single consignment booking
   */
  bookConsignment: (payload: {
    orderId: string;
    provider: CourierProvider | string;
    note?: string;
    deliveryType?: 0 | 1;
    exchange?: boolean;
    alternativePhone?: string;
    recipientEmail?: string;
    forceRebook?: boolean;
  }): Promise<CourierBookingResultDto> => {
    return fetchApi<CourierBookingResultDto>('/shipping/book', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Synchronous bulk consignment booking (Steadfast bulk-order/extended)
   */
  bookBulkConsignments: (payload: {
    orderIds: string[];
    provider: CourierProvider | string;
  }): Promise<CourierBulkBookingResponseDto> => {
    return fetchApi<CourierBulkBookingResponseDto>('/shipping/book/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Sync live delivery / return status for a booked order
   */
  syncOrderStatus: (orderId: string): Promise<CourierStatusSyncResponseDto> => {
    return fetchApi<CourierStatusSyncResponseDto>(
      `/shipping/orders/${encodeURIComponent(orderId)}/sync-status`,
      { method: 'POST' },
    );
  },

  /**
   * Get full courier tracking history steps for an order
   */
  getOrderTrackingHistory: (orderId: string): Promise<{
    orderId: string;
    provider: CourierProvider | null;
    steps: Array<{ timestamp: string; text: string; trackingType?: number | string }>;
  }> => {
    return fetchApi(`/shipping/orders/${encodeURIComponent(orderId)}/tracking-history`);
  },

  /**
   * Submit a return request to the courier (e.g. Steadfast /create_return_request)
   */
  createReturnRequest: (orderId: string, reason?: string) => {
    return fetchApi(`/shipping/orders/${encodeURIComponent(orderId)}/return-request`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * List recent inbound courier webhook logs
   */
  getWebhookLogs: (provider?: string, limit = 25) => {
    return fetchApi('/shipping/webhooks/logs', {
      params: { provider, limit },
    });
  },

  /**
   * Public tracking by tracking code or consignment ID
   */
  trackShipment: (code: string) => {
    return fetchApi(`/shipping/tracking/${encodeURIComponent(code)}`);
  },
};
