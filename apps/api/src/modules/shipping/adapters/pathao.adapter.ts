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
 * Pathao Courier (Hermes) Adapter — Scaffolded on the unified CourierAdapter interface.
 * Ready for live OAuth2 + Store/City/Zone/Area implementation in the next phase.
 */
@Injectable()
export class PathaoAdapter implements CourierAdapter {
  readonly provider = CourierProvider.PATHAO;
  readonly displayName = 'Pathao Logistics';
  readonly defaultBaseUrl = 'https://api-hermes.pathao.com';
  readonly requiredCredentialFields = ['clientId', 'clientSecret', 'username', 'password'];

  async testConnection(config: CourierRuntimeConfig): Promise<CourierConnectionTestOutput> {
    const missing = this.requiredCredentialFields.filter(
      (f) => !(config.credentials?.[f] || '').trim(),
    );
    if (missing.length > 0) {
      return {
        success: false,
        reachable: false,
        authenticated: false,
        latencyMs: 0,
        message: `Pathao credentials missing: ${missing.join(', ')}. Live Pathao OAuth2 adapter will be connected next.`,
      };
    }
    return {
      success: false,
      reachable: false,
      authenticated: false,
      latencyMs: 0,
      message:
        'Pathao credentials are saved & encrypted. Live Pathao Hermes OAuth2 API calls will be enabled in the next phase (use SANDBOX mode to test locally).',
    };
  }

  async bookOrder(
    _config: CourierRuntimeConfig,
    _input: CourierBookOrderInput,
  ): Promise<CourierBookOrderOutput> {
    throw new NotImplementedException(
      'Pathao live API booking is scheduled for the next phase. Switch Pathao to SANDBOX mode for test bookings.',
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
      error: 'Pathao live bulk booking is scheduled for the next phase.',
    }));
  }

  async getDeliveryStatus(): Promise<CourierStatusOutput> {
    throw new NotImplementedException('Pathao live status sync is scheduled for the next phase.');
  }

  verifyWebhook(
    config: CourierRuntimeConfig,
    _rawBody: Buffer | string | undefined,
    headers: Record<string, string | string[] | undefined>,
  ): CourierWebhookVerification {
    const secret = (config.webhookSecret || '').trim();
    if (!secret) return { valid: true };
    const provided = String(headers['x-pathao-signature'] || headers['authorization'] || '').trim();
    return { valid: provided === secret || provided === `Bearer ${secret}` };
  }

  parseWebhook(payload: any): ParsedCourierWebhookEvent {
    const rawStatus = String(payload?.order_status || payload?.status || '').toUpperCase();
    let mappedOrderStatus: OrderStatus | null = null;
    if (rawStatus === 'DELIVERED') mappedOrderStatus = OrderStatus.DELIVERED;
    else if (rawStatus === 'PARTIAL_DELIVERY') mappedOrderStatus = OrderStatus.PARTIAL_DELIVERED;
    else if (rawStatus === 'RETURNED' || rawStatus === 'RETURN_TO_MERCHANT')
      mappedOrderStatus = OrderStatus.RETURNED;
    else if (rawStatus === 'PICKED_UP' || rawStatus === 'IN_TRANSIT')
      mappedOrderStatus = OrderStatus.DISPATCHED;

    return {
      notificationType: String(payload?.event || 'delivery_status'),
      consignmentId: payload?.consignment_id ? String(payload.consignment_id) : null,
      invoice: payload?.merchant_order_id ? String(payload.merchant_order_id) : null,
      trackingCode: payload?.consignment_id ? String(payload.consignment_id) : null,
      rawStatus,
      mappedOrderStatus,
      isFinalSettlementStatus:
        mappedOrderStatus === OrderStatus.DELIVERED ||
        mappedOrderStatus === OrderStatus.PARTIAL_DELIVERED ||
        mappedOrderStatus === OrderStatus.RETURNED,
      trackingMessage: payload?.reason || null,
      updatedAt: payload?.updated_at || null,
      rawPayload: payload,
    };
  }
}
