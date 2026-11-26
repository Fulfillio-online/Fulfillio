import { Injectable, NotImplementedException } from '@nestjs/common';
import { CourierProvider, OrderStatus } from '@fulfillio/contracts';
import {
  CourierAdapter,
  CourierBookOrderInput,
  CourierBookOrderOutput,
  CourierBulkBookItemOutput,
  CourierConnectionTestOutput,
  CourierRuntimeConfig,
  CourierStatusOutput,
  CourierWebhookVerification,
  ParsedCourierWebhookEvent,
} from './courier-adapter.interface';

/**
 * RedX Logistics (OpenAPI) Adapter — Scaffolded on the unified CourierAdapter interface.
 * Ready for live Bearer token + Area/Parcel implementation in the next phase.
 */
@Injectable()
export class RedxAdapter implements CourierAdapter {
  readonly provider = CourierProvider.REDX;
  readonly displayName = 'RedX Logistics';
  readonly defaultBaseUrl = 'https://openapi.redx.com.bd/v1.0.0-beta';
  readonly requiredCredentialFields = ['apiToken'];

  async testConnection(config: CourierRuntimeConfig): Promise<CourierConnectionTestOutput> {
    if (!(config.credentials?.apiToken || '').trim()) {
      return {
        success: false,
        reachable: false,
        authenticated: false,
        latencyMs: 0,
        message: 'RedX API Access Token is missing. Configure it in Admin > Couriers.',
      };
    }
    return {
      success: false,
      reachable: false,
      authenticated: false,
      latencyMs: 0,
      message:
        'RedX token is saved & encrypted. Live RedX OpenAPI calls will be enabled in the next phase (use SANDBOX mode to test locally).',
    };
  }

  async bookOrder(
    _config: CourierRuntimeConfig,
    _input: CourierBookOrderInput,
  ): Promise<CourierBookOrderOutput> {
    throw new NotImplementedException(
      'RedX live API booking is scheduled for the next phase. Switch RedX to SANDBOX mode for test bookings.',
    );
  }

  async bookBulkOrders(
    _config: CourierRuntimeConfig,
    inputs: CourierBookOrderInput[],
  ): Promise<CourierBulkBookItemOutput[]> {
    return inputs.map((input) => ({
      orderId: input.orderId,
      invoice: input.invoice,
      success: false,
      error: 'RedX live bulk booking is scheduled for the next phase.',
    }));
  }

  async getDeliveryStatus(): Promise<CourierStatusOutput> {
    throw new NotImplementedException('RedX live status sync is scheduled for the next phase.');
  }

  verifyWebhook(
    config: CourierRuntimeConfig,
    _rawBody: Buffer | string | undefined,
    headers: Record<string, string | string[] | undefined>,
  ): CourierWebhookVerification {
    const secret = (config.webhookSecret || '').trim();
    if (!secret) return { valid: true };
    const provided = String(headers['api-access-token'] || headers['authorization'] || '').trim();
    return { valid: provided === secret || provided === `Bearer ${secret}` };
  }

  parseWebhook(payload: any): ParsedCourierWebhookEvent {
    const rawStatus = String(payload?.status || '').toLowerCase();
    let mappedOrderStatus: OrderStatus | null = null;
    if (rawStatus === 'delivered') mappedOrderStatus = OrderStatus.DELIVERED;
    else if (rawStatus === 'partial-delivered') mappedOrderStatus = OrderStatus.PARTIAL_DELIVERED;
    else if (rawStatus === 'returned' || rawStatus === 'agent-returning')
      mappedOrderStatus = OrderStatus.RETURNED;
    else if (rawStatus === 'pickup-pending' || rawStatus === 'delivery-in-progress')
      mappedOrderStatus = OrderStatus.DISPATCHED;

    return {
      notificationType: 'delivery_status',
      consignmentId: payload?.tracking_number ? String(payload.tracking_number) : null,
      invoice: payload?.invoice_number ? String(payload.invoice_number) : null,
      trackingCode: payload?.tracking_number ? String(payload.tracking_number) : null,
      rawStatus,
      mappedOrderStatus,
      isFinalSettlementStatus:
        mappedOrderStatus === OrderStatus.DELIVERED ||
        mappedOrderStatus === OrderStatus.PARTIAL_DELIVERED ||
        mappedOrderStatus === OrderStatus.RETURNED,
      trackingMessage: payload?.message_en || payload?.message || null,
      updatedAt: payload?.timestamp || null,
      rawPayload: payload,
    };
  }
}
