import { Injectable, BadGatewayException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { CourierProvider, OrderStatus } from '@fulfillio/contracts';
import {
  CourierAdapter,
  CourierBookOrderInput,
  CourierBookOrderOutput,
  CourierBulkBookItemOutput,
  CourierConnectionTestOutput,
  CourierReturnRequestInput,
  CourierReturnRequestOutput,
  CourierRuntimeConfig,
  CourierStatusOutput,
  CourierTrackingStep,
  CourierWebhookVerification,
  ParsedCourierWebhookEvent,
} from './courier-adapter.interface';

const STEADFAST_DEFAULT_BASE_URL = 'https://portal.packzy.com/api/v1';
const REQUEST_TIMEOUT_MS = 15000;
const BULK_CHUNK_SIZE = 500;

/**
 * Official Steadfast Courier API v1 (Packzy) Adapter
 * Built directly from https://steadfast.com.bd/user/api/guide & /user/webhook/add
 */
@Injectable()
export class SteadfastAdapter implements CourierAdapter {
  readonly provider = CourierProvider.STEADFAST;
  readonly displayName = 'Steadfast Courier';
  readonly defaultBaseUrl = STEADFAST_DEFAULT_BASE_URL;
  readonly requiredCredentialFields = ['apiKey', 'secretKey'];

  private getBaseUrl(config: CourierRuntimeConfig): string {
    return (config.baseUrl || STEADFAST_DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  private getAuthHeaders(config: CourierRuntimeConfig): Record<string, string> {
    const apiKey = (config.credentials?.apiKey || '').trim();
    const secretKey = (config.credentials?.secretKey || '').trim();
    if (!apiKey || !secretKey) {
      throw new BadRequestException(
        'Steadfast API Key and Secret Key are not configured. Configure them in Admin > Couriers first.',
      );
    }
    return {
      'Api-Key': apiKey,
      'Secret-Key': secretKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * Steadfast strips {, }, ;, <, >, $ and truncates fields.
   * Clean proactively to avoid surprises.
   */
  private sanitizeText(value: string | undefined | null, maxLen: number): string {
    if (!value) return '';
    return String(value)
      .replace(/[{};<>$]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLen);
  }

  /**
   * Steadfast invoice: letters, digits, hyphens, underscores only, max 100 chars.
   */
  private sanitizeInvoice(rawInvoice: string): string {
    const cleaned = String(rawInvoice || '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 100);
    if (!cleaned) {
      throw new BadRequestException('Order invoice/ID is required for Steadfast booking.');
    }
    return cleaned;
  }

  /**
   * Steadfast recipient_phone: 11 digits beginning with 01.
   */
  private normalizeBdPhone(rawPhone: string): string {
    const digits = String(rawPhone || '').replace(/\D/g, '');
    let normalized = digits;
    if (normalized.startsWith('8801') && normalized.length === 13) {
      normalized = normalized.slice(2);
    } else if (normalized.startsWith('008801') && normalized.length === 15) {
      normalized = normalized.slice(4);
    }
    if (!/^01\d{9}$/.test(normalized)) {
      throw new BadRequestException(
        `Invalid Bangladeshi phone number "${rawPhone}". Steadfast requires 11 digits starting with 01.`,
      );
    }
    return normalized;
  }

  private mapSteadfastPayload(input: CourierBookOrderInput): Record<string, any> {
    const cod = Math.max(0, Math.min(1_000_000, Math.round(Number(input.codAmount) || 0)));
    const body: Record<string, any> = {
      invoice: this.sanitizeInvoice(input.invoice),
      recipient_name: this.sanitizeText(input.recipientName, 100),
      recipient_phone: this.normalizeBdPhone(input.recipientPhone),
      recipient_address: this.sanitizeText(input.recipientAddress, 490),
      cod_amount: cod,
    };

    if (!body.recipient_name) {
      throw new BadRequestException('Recipient name is required for Steadfast booking.');
    }
    if (!body.recipient_address) {
      throw new BadRequestException('Recipient address is required for Steadfast booking.');
    }

    if (input.note) {
      body.note = this.sanitizeText(input.note, 480);
    }
    if (input.alternativePhone) {
      try {
        body.alternative_phone = this.normalizeBdPhone(input.alternativePhone);
      } catch {
        // Ignore invalid optional alternative phone rather than blocking booking
      }
    }
    if (input.recipientEmail && input.recipientEmail.includes('@')) {
      body.recipient_email = input.recipientEmail.trim();
    }
    if (input.itemDescription) {
      body.item_description = this.sanitizeText(input.itemDescription, 255);
    }
    if (input.totalLot && input.totalLot > 0) {
      body.total_lot = Math.floor(input.totalLot);
    }
    if (input.deliveryType === 0 || input.deliveryType === 1) {
      body.delivery_type = input.deliveryType;
    }
    if (typeof input.exchange === 'boolean') {
      body.exchange = input.exchange;
    }

    return body;
  }

  /**
   * Map Steadfast delivery_status (including return statuses) to Fulfillio OrderStatus.
   * Per Steadfast guide: do NOT settle books on *_approval_pending; wait for confirmed
   * delivered, partial_delivered, or cancelled.
   */
  mapDeliveryStatus(rawStatus?: string | null): {
    mappedOrderStatus: OrderStatus | null;
    isFinalSettlementStatus: boolean;
  } {
    const s = String(rawStatus || '').trim().toLowerCase();
    switch (s) {
      case 'delivered':
        return { mappedOrderStatus: OrderStatus.DELIVERED, isFinalSettlementStatus: true };
      case 'partial_delivered':
      case 'partial_delivered_return_proccessing':
      case 'partial_delivered_return_processing':
      case 'partial_delivered_return_rider_assigned':
      case 'partial_delivered_return_received':
        return { mappedOrderStatus: OrderStatus.PARTIAL_DELIVERED, isFinalSettlementStatus: true };
      case 'cancelled':
      case 'cancelled_return_proccessing':
      case 'cancelled_return_processing':
      case 'cancelled_return_rider_assigned':
      case 'cancelled_return_received':
        return { mappedOrderStatus: OrderStatus.RETURNED, isFinalSettlementStatus: true };
      case 'pending':
      case 'in_review':
      case 'hold':
      case 'delivered_approval_pending':
      case 'partial_delivered_approval_pending':
      case 'cancelled_approval_pending':
      case 'unknown_approval_pending':
        // Parcel is with Steadfast / in transit / awaiting accounts confirmation
        return { mappedOrderStatus: OrderStatus.DISPATCHED, isFinalSettlementStatus: false };
      default:
        return { mappedOrderStatus: null, isFinalSettlementStatus: false };
    }
  }

  private async requestJson(
    url: string,
    options: RequestInit,
  ): Promise<{ ok: boolean; status: number; data: any; latencyMs: number }> {
    const started = Date.now();
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const latencyMs = Date.now() - started;
      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }
      return { ok: response.ok, status: response.status, data, latencyMs };
    } catch (err: any) {
      throw new BadGatewayException(
        `Steadfast API network error (${url}): ${err?.message || 'Request timed out or unreachable'}`,
      );
    }
  }

  private formatSteadfastError(status: number, data: any): string {
    if (status === 401) {
      return 'Steadfast Authentication failed (401): Invalid Api-Key or Secret-Key.';
    }
    if (status === 403) {
      return 'Steadfast Forbidden (403): Account inactive or KYC/ownership verification required.';
    }
    if (status === 429) {
      return 'Steadfast Rate Limited / Locked Out (429): Too many requests or repeated failed auth attempts (60-minute lockout).';
    }
    if (data?.errors && typeof data.errors === 'object') {
      const details = Object.entries(data.errors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}`)
        .join('; ');
      return `Steadfast validation error (${status}): ${details}`;
    }
    if (data?.message) {
      return `Steadfast API error (${status}): ${data.message}`;
    }
    return `Steadfast API error (HTTP ${status})`;
  }

  async testConnection(config: CourierRuntimeConfig): Promise<CourierConnectionTestOutput> {
    const baseUrl = this.getBaseUrl(config);

    // Step 1: Unauthenticated reachability check via GET /ping
    let reachable = false;
    let pingLatency = 0;
    try {
      const pingRes = await this.requestJson(`${baseUrl}/ping`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      pingLatency = pingRes.latencyMs;
      reachable = pingRes.ok && (pingRes.data?.message === 'pong' || pingRes.status === 200);
    } catch (err: any) {
      return {
        success: false,
        reachable: false,
        authenticated: false,
        latencyMs: 0,
        message: err?.message || `Unable to reach Steadfast endpoint ${baseUrl}/ping`,
      };
    }

    // Step 2: Authenticated verification + live withdrawable balance via GET /get_balance
    const apiKey = (config.credentials?.apiKey || '').trim();
    const secretKey = (config.credentials?.secretKey || '').trim();
    if (!apiKey || !secretKey) {
      return {
        success: false,
        reachable,
        authenticated: false,
        latencyMs: pingLatency,
        message: 'Steadfast API endpoint is reachable, but Api-Key and Secret-Key are missing.',
      };
    }

    const balRes = await this.requestJson(`${baseUrl}/get_balance`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        Accept: 'application/json',
      },
    });

    if (balRes.ok && balRes.data && balRes.data.current_balance !== undefined) {
      const balance = Number(balRes.data.current_balance);
      return {
        success: true,
        reachable: true,
        authenticated: true,
        latencyMs: balRes.latencyMs,
        balance,
        currency: 'BDT',
        statusCode: balRes.status,
        message: `Connected to Steadfast API v1. Current withdrawable balance: ৳${balance.toLocaleString()}.`,
      };
    }

    return {
      success: false,
      reachable,
      authenticated: false,
      latencyMs: balRes.latencyMs,
      statusCode: balRes.status,
      message: this.formatSteadfastError(balRes.status, balRes.data),
    };
  }

  async getBalance(config: CourierRuntimeConfig): Promise<{ balance: number; currency: string }> {
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getAuthHeaders(config);
    const res = await this.requestJson(`${baseUrl}/get_balance`, {
      method: 'GET',
      headers,
    });

    if (!res.ok || res.data?.current_balance === undefined) {
      throw new BadGatewayException(this.formatSteadfastError(res.status, res.data));
    }

    return {
      balance: Number(res.data.current_balance),
      currency: 'BDT',
    };
  }

  async bookOrder(
    config: CourierRuntimeConfig,
    input: CourierBookOrderInput,
  ): Promise<CourierBookOrderOutput> {
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getAuthHeaders(config);
    const payload = this.mapSteadfastPayload(input);

    const res = await this.requestJson(`${baseUrl}/create_order`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data?.consignment) {
      const c = res.data.consignment;
      return {
        consignmentId: String(c.consignment_id),
        trackingCode: String(c.tracking_code),
        trackingLink: c.tracking_link ? String(c.tracking_link) : null,
        deliveryStatus: c.status ? String(c.status) : 'in_review',
        rawResponse: res.data,
      };
    }

    throw new BadGatewayException(this.formatSteadfastError(res.status, res.data));
  }

  /**
   * Uses Steadfast's preferred /create_order/bulk-order/extended endpoint (up to 500 per batch)
   * which returns human-readable per-item validation messages and supports per-order metadata.
   */
  async bookBulkOrders(
    config: CourierRuntimeConfig,
    inputs: CourierBookOrderInput[],
  ): Promise<CourierBulkBookItemOutput[]> {
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getAuthHeaders(config);
    const results: CourierBulkBookItemOutput[] = [];

    // Pre-validate locally so invalid phones/addresses don't fail silently or break valid items
    const validEntries: Array<{ input: CourierBookOrderInput; payload: Record<string, any> }> = [];
    for (const input of inputs) {
      try {
        const payload = this.mapSteadfastPayload(input);
        validEntries.push({ input, payload });
      } catch (err: any) {
        results.push({
          orderId: input.orderId,
          invoice: input.invoice,
          success: false,
          error: err?.message || 'Invalid order payload for Steadfast',
        });
      }
    }

    for (let i = 0; i < validEntries.length; i += BULK_CHUNK_SIZE) {
      const chunk = validEntries.slice(i, i + BULK_CHUNK_SIZE);
      const res = await this.requestJson(`${baseUrl}/create_order/bulk-order/extended`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: chunk.map((c) => c.payload) }),
      });

      if (!res.ok || !Array.isArray(res.data?.data)) {
        const errMsg = this.formatSteadfastError(res.status, res.data);
        for (const item of chunk) {
          results.push({
            orderId: item.input.orderId,
            invoice: item.input.invoice,
            success: false,
            error: errMsg,
          });
        }
        continue;
      }

      const responseItems: any[] = res.data.data;
      for (let idx = 0; idx < chunk.length; idx++) {
        const original = chunk[idx].input;
        const entry =
          responseItems.find((r) => r?.invoice === chunk[idx].payload.invoice) || responseItems[idx];

        if (entry && entry.status === 'success' && entry.consignment_id && entry.tracking_code) {
          results.push({
            orderId: original.orderId,
            invoice: original.invoice,
            success: true,
            consignmentId: String(entry.consignment_id),
            trackingCode: String(entry.tracking_code),
            trackingLink: entry.tracking_link ? String(entry.tracking_link) : null,
            deliveryStatus: 'in_review',
          });
        } else {
          let errText = 'Steadfast rejected this parcel';
          if (Array.isArray(entry?.error)) {
            errText = entry.error.join('; ');
          } else if (typeof entry?.error === 'string') {
            errText = entry.error;
          }
          results.push({
            orderId: original.orderId,
            invoice: original.invoice,
            success: false,
            error: errText,
          });
        }
      }
    }

    return results;
  }

  /**
   * Prefers /status_with_return_status_by_cid/{consignment_id} so granular return statuses
   * (e.g. cancelled_return_rider_assigned, cancelled_return_received) are captured.
   */
  async getDeliveryStatus(
    config: CourierRuntimeConfig,
    ref: { consignmentId?: string | null; invoice?: string | null; trackingCode?: string | null },
  ): Promise<CourierStatusOutput> {
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getAuthHeaders(config);

    let endpoint: string;
    if (ref.consignmentId) {
      endpoint = `${baseUrl}/status_with_return_status_by_cid/${encodeURIComponent(ref.consignmentId)}`;
    } else if (ref.trackingCode) {
      endpoint = `${baseUrl}/status_by_trackingcode/${encodeURIComponent(ref.trackingCode)}`;
    } else if (ref.invoice) {
      endpoint = `${baseUrl}/status_by_invoice/${encodeURIComponent(ref.invoice)}`;
    } else {
      throw new BadRequestException(
        'Cannot check Steadfast status: order has no consignmentId, trackingCode, or invoice.',
      );
    }

    const res = await this.requestJson(endpoint, { method: 'GET', headers });
    if (!res.ok || !res.data?.delivery_status) {
      throw new BadGatewayException(this.formatSteadfastError(res.status, res.data));
    }

    const rawStatus = String(res.data.delivery_status);
    const { mappedOrderStatus, isFinalSettlementStatus } = this.mapDeliveryStatus(rawStatus);

    return {
      rawStatus,
      mappedOrderStatus,
      isFinalSettlementStatus,
      rawResponse: res.data,
    };
  }

  async getTrackingHistory(
    config: CourierRuntimeConfig,
    ref: { consignmentId?: string | null; invoice?: string | null; trackingCode?: string | null },
  ): Promise<CourierTrackingStep[]> {
    if (!ref.invoice) return [];
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getAuthHeaders(config);
    const res = await this.requestJson(
      `${baseUrl}/trackings_by_invoice/${encodeURIComponent(ref.invoice)}`,
      { method: 'GET', headers },
    );

    if (!res.ok || !Array.isArray(res.data?.tracking)) {
      throw new BadGatewayException(this.formatSteadfastError(res.status, res.data));
    }

    return res.data.tracking.map((step: any) => ({
      timestamp: step.created_at || new Date().toISOString(),
      text: String(step.text || ''),
      trackingType: step.tracking_type,
    }));
  }

  async createReturnRequest(
    config: CourierRuntimeConfig,
    input: CourierReturnRequestInput,
  ): Promise<CourierReturnRequestOutput> {
    const baseUrl = this.getBaseUrl(config);
    const headers = this.getAuthHeaders(config);

    const body: Record<string, any> = {};
    if (input.consignmentId && /^\d+$/.test(String(input.consignmentId))) {
      body.consignment_id = Number(input.consignmentId);
    } else if (input.trackingCode) {
      body.tracking_code = input.trackingCode;
    } else if (input.invoice) {
      body.invoice = input.invoice;
    } else {
      throw new BadRequestException(
        'Provide consignmentId, trackingCode, or invoice to create a Steadfast return request.',
      );
    }

    if (input.reason) {
      body.reason = this.sanitizeText(input.reason, 500);
    }

    const res = await this.requestJson(`${baseUrl}/create_return_request`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if ((res.status === 201 || res.ok) && res.data?.id) {
      return {
        id: String(res.data.id),
        consignmentId: res.data.consignment_id ? String(res.data.consignment_id) : input.consignmentId,
        status: String(res.data.status || 'pending'),
        reason: res.data.reason || input.reason || null,
        rawResponse: res.data,
      };
    }

    throw new BadGatewayException(this.formatSteadfastError(res.status, res.data));
  }

  /**
   * Verify Steadfast Webhook per https://steadfast.com.bd/user/webhook/add:
   * - If webhookSecret is configured, verify X-Signature (HMAC-SHA256 hex of raw body)
   *   using crypto.timingSafeEqual, OR Authorization: Bearer <token>.
   */
  verifyWebhook(
    config: CourierRuntimeConfig,
    rawBody: Buffer | string | undefined,
    headers: Record<string, string | string[] | undefined>,
  ): CourierWebhookVerification {
    const secret = (config.webhookSecret || '').trim();
    if (!secret) {
      // No webhook secret configured on integration -> allow (matches Steadfast's optional auth token)
      return { valid: true };
    }

    const getHeader = (name: string): string => {
      const val = headers[name.toLowerCase()] ?? headers[name];
      return Array.isArray(val) ? val[0] || '' : String(val || '');
    };

    const xSignature = getHeader('x-signature').trim();
    if (xSignature && rawBody) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const sigBuf = Buffer.from(xSignature, 'utf8');
      const expBuf = Buffer.from(expected, 'utf8');
      if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
        return { valid: true };
      }
      return { valid: false, reason: 'Invalid X-Signature HMAC-SHA256 digest.' };
    }

    const authHeader = getHeader('authorization').trim();
    if (authHeader.startsWith('Bearer ')) {
      const providedToken = authHeader.slice('Bearer '.length).trim();
      const tokenBuf = Buffer.from(providedToken, 'utf8');
      const secretBuf = Buffer.from(secret, 'utf8');
      if (tokenBuf.length === secretBuf.length && crypto.timingSafeEqual(tokenBuf, secretBuf)) {
        return { valid: true };
      }
      return { valid: false, reason: 'Invalid Authorization Bearer token.' };
    }

    return {
      valid: false,
      reason: 'Missing X-Signature or Authorization Bearer header for configured webhook secret.',
    };
  }

  parseWebhook(payload: any): ParsedCourierWebhookEvent {
    const notificationType = String(payload?.notification_type || 'delivery_status');
    const rawStatus = payload?.status ? String(payload.status) : null;
    const { mappedOrderStatus, isFinalSettlementStatus } =
      notificationType === 'delivery_status'
        ? this.mapDeliveryStatus(rawStatus)
        : { mappedOrderStatus: null, isFinalSettlementStatus: false };

    return {
      notificationType,
      consignmentId: payload?.consignment_id != null ? String(payload.consignment_id) : null,
      invoice: payload?.invoice ? String(payload.invoice) : null,
      trackingCode: payload?.tracking_code || payload?.tracking_id || null,
      rawStatus,
      mappedOrderStatus,
      isFinalSettlementStatus,
      trackingMessage: payload?.tracking_message ? String(payload.tracking_message) : null,
      codAmount: payload?.cod_amount != null ? Number(payload.cod_amount) : null,
      deliveryCharge: payload?.delivery_charge != null ? Number(payload.delivery_charge) : null,
      updatedAt: payload?.updated_at ? String(payload.updated_at) : null,
      rawPayload: payload,
    };
  }
}
