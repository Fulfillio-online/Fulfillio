import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ShippingRepository } from './shipping.repository';
import { BillingService } from '../billing/billing.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  CourierBookingResultDto,
  CourierBulkBookingItemDto,
  CourierBulkBookingResponseDto,
  CourierConnectionStatus,
  CourierIntegrationSummaryDto,
  CourierProvider,
  CourierStatusSyncResponseDto,
  CourierTestConnectionResponse,
  OrderStatus,
} from '@fulfillio/contracts';
import { CourierAdapterRegistry } from './adapters/courier-adapter.registry';
import { CourierBookOrderInput, CourierRuntimeConfig } from './adapters/courier-adapter.interface';
import {
  decryptJson,
  decryptString,
  encryptJson,
  encryptString,
  maskCredentialsMap,
  maskSecret,
} from './crypto/credential-cipher';

@Injectable()
export class ShippingService {
  constructor(
    private readonly repository: ShippingRepository,
    private readonly adapterRegistry: CourierAdapterRegistry,
    private readonly billingService: BillingService,
    private readonly inventoryService?: InventoryService,
  ) {}

  private normalizeProvider(provider: string | CourierProvider): CourierProvider {
    const upper = String(provider || '').trim().toUpperCase();
    if (!Object.values(CourierProvider).includes(upper as CourierProvider)) {
      throw new BadRequestException(`Unsupported courier provider: "${provider}"`);
    }
    return upper as CourierProvider;
  }

  private getWebhookPublicUrl(provider: CourierProvider): string {
    const apiPublicBase = (
      process.env.API_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://api.fulfillio.online/api'
    ).replace(/\/+$/, '');
    return `${apiPublicBase}/shipping/webhooks/${provider.toLowerCase()}`;
  }

  private buildRuntimeConfig(row: any): CourierRuntimeConfig {
    const provider = row.provider as CourierProvider;
    const decryptedCreds = decryptJson<Record<string, string>>(row.encryptedCredentials);
    const decryptedWebhookSecret = decryptString(row.webhookSecret);

    // Optional env fallback only if DB has no credentials saved yet
    const credentials: Record<string, string> = { ...decryptedCreds };
    if (provider === CourierProvider.STEADFAST) {
      if (!credentials.apiKey && process.env.STEADFAST_API_KEY) {
        credentials.apiKey = process.env.STEADFAST_API_KEY;
      }
      if (!credentials.secretKey && process.env.STEADFAST_SECRET_KEY) {
        credentials.secretKey = process.env.STEADFAST_SECRET_KEY;
      }
    }

    return {
      provider,
      baseUrl: row.baseUrl,
      isSandbox: Boolean(row.isSandbox || row.status === CourierConnectionStatus.SANDBOX),
      storeId: row.storeId || null,
      webhookSecret: decryptedWebhookSecret,
      credentials,
    };
  }

  private toSummaryDto(row: any, activeConsignments = 0): CourierIntegrationSummaryDto {
    const provider = row.provider as CourierProvider;
    const creds = decryptJson<Record<string, string>>(row.encryptedCredentials);
    const webhookSecret = decryptString(row.webhookSecret);

    return {
      id: row.id,
      provider,
      displayName: row.displayName,
      status: row.status as CourierConnectionStatus,
      isSandbox: Boolean(row.isSandbox),
      baseUrl: row.baseUrl,
      storeId: row.storeId || null,
      webhookUrl: this.getWebhookPublicUrl(provider),
      hasWebhookSecret: Boolean(webhookSecret),
      webhookSecretMasked: webhookSecret ? maskSecret(webhookSecret) : null,
      hasCredentials: Object.values(creds).some((v) => typeof v === 'string' && v.trim().length > 0),
      credentialsMasked: maskCredentialsMap(creds),
      codChargePercent: Number(row.codChargePercent ?? 1),
      insideDhakaRate: Number(row.insideDhakaRate ?? 60),
      outsideDhakaRate: Number(row.outsideDhakaRate ?? 120),
      autoBookingEnabled: Boolean(row.autoBookingEnabled),
      allowPipelineOverride: Boolean(row.allowPipelineOverride),
      activeConsignments,
      lastHealthStatus: row.lastHealthStatus || null,
      lastLatencyMs: row.lastLatencyMs ?? null,
      lastBalance: row.lastBalance != null ? Number(row.lastBalance) : null,
      lastCheckedAt: row.lastCheckedAt ? new Date(row.lastCheckedAt).toISOString() : null,
      lastError: row.lastError || null,
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }

  // =========================================================================
  // ADMIN COURIER INTEGRATION CONFIGURATION (DB-BACKED, ENCRYPTED)
  // =========================================================================

  async listIntegrations(): Promise<CourierIntegrationSummaryDto[]> {
    const [rows, counts] = await Promise.all([
      this.repository.findAllIntegrations(),
      this.repository.countActiveConsignmentsByProvider(),
    ]);
    return rows.map((row) => this.toSummaryDto(row, counts[row.provider] || 0));
  }

  async upsertIntegration(
    rawProvider: string,
    body: {
      displayName?: string;
      status?: CourierConnectionStatus;
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
    },
  ): Promise<CourierIntegrationSummaryDto> {
    const provider = this.normalizeProvider(rawProvider);
    const existing = await this.repository.findIntegrationByProvider(provider);
    const existingCreds = decryptJson<Record<string, string>>(existing?.encryptedCredentials);

    // Merge credentials: keep existing secret values if caller sends empty or masked bullets
    const mergedCreds: Record<string, string> = { ...existingCreds };
    if (body.credentials && typeof body.credentials === 'object') {
      for (const [k, rawVal] of Object.entries(body.credentials)) {
        if (typeof rawVal !== 'string') continue;
        const val = rawVal.trim();
        if (!val || val.includes('••')) continue;
        mergedCreds[k] = val;
      }
    }

    const updateData: Record<string, any> = {
      encryptedCredentials: encryptJson(mergedCreds),
    };

    if (body.displayName !== undefined) updateData.displayName = body.displayName.trim();
    if (body.baseUrl !== undefined && body.baseUrl.trim()) {
      updateData.baseUrl = body.baseUrl.trim().replace(/\/+$/, '');
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
      updateData.isSandbox = body.status === CourierConnectionStatus.SANDBOX;
    } else if (body.isSandbox !== undefined) {
      updateData.isSandbox = Boolean(body.isSandbox);
    }
    if (body.storeId !== undefined) updateData.storeId = body.storeId?.trim() || null;
    if (body.codChargePercent !== undefined) updateData.codChargePercent = Number(body.codChargePercent) || 0;
    if (body.insideDhakaRate !== undefined) updateData.insideDhakaRate = Number(body.insideDhakaRate) || 0;
    if (body.outsideDhakaRate !== undefined) updateData.outsideDhakaRate = Number(body.outsideDhakaRate) || 0;
    if (body.autoBookingEnabled !== undefined) updateData.autoBookingEnabled = Boolean(body.autoBookingEnabled);
    if (body.allowPipelineOverride !== undefined) {
      updateData.allowPipelineOverride = Boolean(body.allowPipelineOverride);
    }

    if (body.webhookSecret !== undefined) {
      const trimmed = (body.webhookSecret || '').trim();
      if (!trimmed) {
        updateData.webhookSecret = null;
      } else if (!trimmed.includes('••')) {
        updateData.webhookSecret = encryptString(trimmed);
      }
    }

    const saved = await this.repository.upsertIntegration(provider, updateData);
    const counts = await this.repository.countActiveConsignmentsByProvider();
    return this.toSummaryDto(saved, counts[provider] || 0);
  }

  async testConnection(rawProvider: string): Promise<CourierTestConnectionResponse> {
    const provider = this.normalizeProvider(rawProvider);
    const row = await this.repository.findIntegrationByProvider(provider);
    if (!row) {
      throw new NotFoundException(`Courier integration ${provider} not found.`);
    }

    const adapter = this.adapterRegistry.getAdapter(provider);
    const runtimeConfig = this.buildRuntimeConfig(row);
    const checkedAt = new Date();

    const result = await adapter.testConnection(runtimeConfig);

    await this.repository.updateIntegrationHealth(provider, {
      lastHealthStatus: result.success ? 'OK' : 'ERROR',
      lastLatencyMs: result.latencyMs,
      lastBalance: result.balance !== undefined ? result.balance : undefined,
      lastError: result.success ? null : result.message,
      lastCheckedAt: checkedAt,
      status:
        result.success && row.status === CourierConnectionStatus.DISCONNECTED
          ? CourierConnectionStatus.CONNECTED
          : undefined,
    });

    return {
      provider,
      ...result,
      checkedAt: checkedAt.toISOString(),
    };
  }

  async getCourierBalance(rawProvider: string): Promise<{
    provider: CourierProvider;
    balance: number;
    currency: string;
    checkedAt: string;
  }> {
    const provider = this.normalizeProvider(rawProvider);
    const row = await this.repository.findIntegrationByProvider(provider);
    if (!row) throw new NotFoundException(`Courier integration ${provider} not found.`);

    const adapter = this.adapterRegistry.getAdapter(provider);
    if (!adapter.getBalance) {
      throw new BadRequestException(`${provider} does not expose a balance endpoint.`);
    }

    const runtimeConfig = this.buildRuntimeConfig(row);
    const bal = await adapter.getBalance(runtimeConfig);
    const checkedAt = new Date();

    await this.repository.updateIntegrationHealth(provider, {
      lastHealthStatus: 'OK',
      lastBalance: bal.balance,
      lastError: null,
      lastCheckedAt: checkedAt,
    });

    return {
      provider,
      balance: bal.balance,
      currency: bal.currency,
      checkedAt: checkedAt.toISOString(),
    };
  }

  // =========================================================================
  // SYNCHRONOUS SINGLE & BULK CONSIGNMENT BOOKING (STRICT REAL MODE)
  // =========================================================================

  private buildBookInputFromOrder(
    order: any,
    overrides?: {
      note?: string;
      deliveryType?: 0 | 1;
      exchange?: boolean;
      alternativePhone?: string;
      recipientEmail?: string;
    },
  ): CourierBookOrderInput {
    const items = Array.isArray(order.items) ? order.items : [];
    const totalLot = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0) || 1;
    const itemDescription = items
      .map((it: any) => {
        const title = it.productTitle || it.variant?.product?.title || it.variant?.title || it.sku || 'Item';
        return `${title} x${it.quantity || 1}`;
      })
      .join(', ');

    const invoice = order.externalOrderId || order.id;
    const codAmount =
      order.codAmount != null && Number(order.codAmount) >= 0
        ? Number(order.codAmount)
        : Number(order.totalAmount || 0);

    return {
      orderId: order.id,
      invoice,
      recipientName: order.customerName,
      recipientPhone: order.customerPhone,
      recipientAddress: order.customerAddress,
      codAmount,
      note: overrides?.note || `Fulfillio Order ${invoice}`,
      alternativePhone: overrides?.alternativePhone,
      recipientEmail: overrides?.recipientEmail,
      itemDescription: itemDescription || undefined,
      totalLot,
      deliveryType: overrides?.deliveryType ?? 0,
      exchange: overrides?.exchange ?? false,
      city: order.city,
    };
  }

  async bookConsignment(
    orderId: string,
    rawProvider: CourierProvider | string,
    options?: {
      note?: string;
      deliveryType?: 0 | 1;
      exchange?: boolean;
      alternativePhone?: string;
      recipientEmail?: string;
      forceRebook?: boolean;
    },
  ): Promise<CourierBookingResultDto> {
    const provider = this.normalizeProvider(rawProvider);
    const [order, integration] = await Promise.all([
      this.repository.findOrderForBooking(orderId),
      this.repository.findIntegrationByProvider(provider),
    ]);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }
    if (!integration) {
      throw new NotFoundException(`Courier integration ${provider} not found.`);
    }

    if (order.consignmentId && order.trackingCode && !options?.forceRebook) {
      throw new BadRequestException(
        `Order ${order.id} is already booked with ${order.courierProvider || provider} (Consignment: ${order.consignmentId}, Tracking: ${order.trackingCode}).`,
      );
    }

    if (integration.status === CourierConnectionStatus.DISCONNECTED) {
      throw new BadRequestException(
        `${integration.displayName} is currently DISCONNECTED. Configure & enable it in Admin > Couriers first.`,
      );
    }

    const isSandbox =
      integration.status === CourierConnectionStatus.SANDBOX || integration.isSandbox;

    if (isSandbox) {
      const trackingCode = `SBX-${provider.slice(0, 3)}-${Date.now().toString().slice(-6)}`;
      const consignmentId = `SBX-CN-${Math.floor(100000 + Math.random() * 900000)}`;
      await this.repository.assignCourier(
        order.id,
        provider,
        trackingCode,
        consignmentId,
        null,
        'in_review',
      );
      return {
        orderId: order.id,
        provider,
        consignmentId,
        trackingCode,
        trackingLink: null,
        deliveryStatus: 'in_review',
        isSimulated: true,
      };
    }

    // Strict Real Mode: call official courier API directly, surface real errors
    const adapter = this.adapterRegistry.getAdapter(provider);
    const runtimeConfig = this.buildRuntimeConfig(integration);
    const bookInput = this.buildBookInputFromOrder(order, options);
    const booked = await adapter.bookOrder(runtimeConfig, bookInput);

    await this.repository.assignCourier(
      order.id,
      provider,
      booked.trackingCode,
      booked.consignmentId,
      booked.trackingLink ?? null,
      booked.deliveryStatus ?? 'in_review',
    );

    return {
      orderId: order.id,
      provider,
      consignmentId: booked.consignmentId,
      trackingCode: booked.trackingCode,
      trackingLink: booked.trackingLink ?? null,
      deliveryStatus: booked.deliveryStatus ?? 'in_review',
      isSimulated: false,
    };
  }

  async bookBulkConsignments(
    orderIds: string[],
    rawProvider: CourierProvider | string,
  ): Promise<CourierBulkBookingResponseDto> {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new BadRequestException('Provide at least one orderId for bulk booking.');
    }

    const provider = this.normalizeProvider(rawProvider);
    const [orders, integration] = await Promise.all([
      this.repository.findOrdersForBulkBooking(orderIds),
      this.repository.findIntegrationByProvider(provider),
    ]);

    if (!integration) {
      throw new NotFoundException(`Courier integration ${provider} not found.`);
    }
    if (integration.status === CourierConnectionStatus.DISCONNECTED) {
      throw new BadRequestException(
        `${integration.displayName} is DISCONNECTED. Configure & enable it in Admin > Couriers first.`,
      );
    }

    const orderMap = new Map(orders.map((o) => [o.id, o]));
    const results: CourierBulkBookingItemDto[] = [];
    const eligibleOrders: any[] = [];

    for (const id of orderIds) {
      const ord = orderMap.get(id);
      if (!ord) {
        results.push({ orderId: id, invoice: id, success: false, error: 'Order not found' });
      } else if (ord.consignmentId && ord.trackingCode) {
        results.push({
          orderId: ord.id,
          invoice: ord.externalOrderId || ord.id,
          success: false,
          consignmentId: ord.consignmentId,
          trackingCode: ord.trackingCode,
          error: `Already booked (${ord.trackingCode})`,
        });
      } else {
        eligibleOrders.push(ord);
      }
    }

    const isSandbox =
      integration.status === CourierConnectionStatus.SANDBOX || integration.isSandbox;

    if (eligibleOrders.length > 0) {
      if (isSandbox) {
        for (const ord of eligibleOrders) {
          const trackingCode = `SBX-${provider.slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;
          const consignmentId = `SBX-CN-${Math.floor(100000 + Math.random() * 900000)}`;
          await this.repository.assignCourier(
            ord.id,
            provider,
            trackingCode,
            consignmentId,
            null,
            'in_review',
          );
          results.push({
            orderId: ord.id,
            invoice: ord.externalOrderId || ord.id,
            success: true,
            consignmentId,
            trackingCode,
            trackingLink: null,
            deliveryStatus: 'in_review',
            isSimulated: true,
          });
        }
      } else {
        const adapter = this.adapterRegistry.getAdapter(provider);
        const runtimeConfig = this.buildRuntimeConfig(integration);
        const inputs = eligibleOrders.map((ord) => this.buildBookInputFromOrder(ord));
        const bulkResults = await adapter.bookBulkOrders(runtimeConfig, inputs);

        for (const item of bulkResults) {
          if (item.success && item.consignmentId && item.trackingCode) {
            await this.repository.assignCourier(
              item.orderId,
              provider,
              item.trackingCode,
              item.consignmentId,
              item.trackingLink ?? null,
              item.deliveryStatus ?? 'in_review',
            );
          }
          results.push({
            ...item,
            isSimulated: false,
          });
        }
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    return {
      provider,
      total: results.length,
      succeeded,
      failed: results.length - succeeded,
      results,
    };
  }

  // =========================================================================
  // LIVE STATUS SYNC, TRACKING HISTORY & RETURN REQUESTS
  // =========================================================================

  async syncOrderCourierStatus(orderId: string): Promise<CourierStatusSyncResponseDto> {
    const order = await this.repository.findOrderForBooking(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found.`);
    if (!order.courierProvider) {
      throw new BadRequestException(`Order ${orderId} is not booked with any courier yet.`);
    }

    const provider = order.courierProvider as CourierProvider;
    const integration = await this.repository.findIntegrationByProvider(provider);
    if (!integration) throw new NotFoundException(`Courier integration ${provider} not found.`);

    if (integration.status === CourierConnectionStatus.SANDBOX || integration.isSandbox) {
      return {
        orderId: order.id,
        provider,
        consignmentId: order.consignmentId,
        trackingCode: order.trackingCode,
        rawStatus: order.courierDeliveryStatus || 'in_review',
        mappedOrderStatus: null,
        orderStatusUpdated: false,
        syncedAt: new Date().toISOString(),
      };
    }

    const adapter = this.adapterRegistry.getAdapter(provider);
    const runtimeConfig = this.buildRuntimeConfig(integration);
    const statusOutput = await adapter.getDeliveryStatus(runtimeConfig, {
      consignmentId: order.consignmentId,
      trackingCode: order.trackingCode,
      invoice: order.externalOrderId || order.id,
    });

    const shouldUpdateOrderStatus =
      Boolean(statusOutput.mappedOrderStatus) &&
      statusOutput.mappedOrderStatus !== (order.status as unknown as OrderStatus);

    const updated = await this.repository.updateOrderFromCourierEvent(order.id, {
      courierDeliveryStatus: statusOutput.rawStatus,
      status: shouldUpdateOrderStatus ? statusOutput.mappedOrderStatus : null,
      timelineEntry: {
        status: 'COURIER_STATUS_SYNC',
        provider,
        rawStatus: statusOutput.rawStatus,
        mappedOrderStatus: statusOutput.mappedOrderStatus,
        message: `Synced live status from ${provider}: ${statusOutput.rawStatus}`,
        timestamp: new Date().toISOString(),
      },
    });

    if (updated && shouldUpdateOrderStatus && statusOutput.mappedOrderStatus) {
      await this.applyOrderStatusSideEffects(
        updated,
        provider,
        statusOutput.mappedOrderStatus,
        statusOutput.isFinalSettlementStatus,
      );
    }

    return {
      orderId: order.id,
      provider,
      consignmentId: order.consignmentId,
      trackingCode: order.trackingCode,
      rawStatus: statusOutput.rawStatus,
      mappedOrderStatus: statusOutput.mappedOrderStatus,
      orderStatusUpdated: shouldUpdateOrderStatus,
      syncedAt: new Date().toISOString(),
    };
  }

  async getOrderTrackingHistory(orderId: string) {
    const order = await this.repository.findOrderForBooking(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found.`);
    if (!order.courierProvider) {
      return { orderId, provider: null, steps: [] };
    }

    const provider = order.courierProvider as CourierProvider;
    const integration = await this.repository.findIntegrationByProvider(provider);
    if (!integration || integration.isSandbox || integration.status !== CourierConnectionStatus.CONNECTED) {
      return { orderId, provider, steps: [] };
    }

    const adapter = this.adapterRegistry.getAdapter(provider);
    if (!adapter.getTrackingHistory) {
      return { orderId, provider, steps: [] };
    }

    const runtimeConfig = this.buildRuntimeConfig(integration);
    const steps = await adapter.getTrackingHistory(runtimeConfig, {
      consignmentId: order.consignmentId,
      trackingCode: order.trackingCode,
      invoice: order.externalOrderId || order.id,
    });

    return { orderId, provider, steps };
  }

  async createCourierReturnRequest(orderId: string, reason?: string) {
    const order = await this.repository.findOrderForBooking(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found.`);
    if (!order.courierProvider) {
      throw new BadRequestException(`Order ${orderId} has no courier assigned.`);
    }

    const provider = order.courierProvider as CourierProvider;
    const integration = await this.repository.findIntegrationByProvider(provider);
    if (!integration || integration.status !== CourierConnectionStatus.CONNECTED) {
      throw new BadRequestException(`${provider} must be CONNECTED to create a live return request.`);
    }

    const adapter = this.adapterRegistry.getAdapter(provider);
    if (!adapter.createReturnRequest) {
      throw new BadRequestException(`${provider} does not support API return requests.`);
    }

    const runtimeConfig = this.buildRuntimeConfig(integration);
    const result = await adapter.createReturnRequest(runtimeConfig, {
      consignmentId: order.consignmentId,
      trackingCode: order.trackingCode,
      invoice: order.externalOrderId || order.id,
      reason,
    });

    await this.repository.updateOrderFromCourierEvent(order.id, {
      timelineEntry: {
        status: 'COURIER_RETURN_REQUESTED',
        provider,
        returnRequestId: result.id,
        message: `Return request #${result.id} submitted to ${provider}${reason ? `: ${reason}` : ''}`,
        timestamp: new Date().toISOString(),
      },
    });

    return result;
  }

  // =========================================================================
  // MANIFEST & PUBLIC TRACKING
  // =========================================================================

  async generateHandoverManifest(provider: CourierProvider) {
    const normalized = this.normalizeProvider(provider);
    const orders = await this.repository.getManifestOrders(normalized);
    return {
      manifestId: `MAN-${normalized}-${Date.now()}`,
      provider: normalized,
      totalParcels: orders.length,
      orders: orders.map((o) => ({
        id: o.id,
        trackingCode: o.trackingCode,
        consignmentId: o.consignmentId,
        customerName: o.customerName,
        codAmount: o.codAmount,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async getPublicTracking(trackingCode: string) {
    const order = await this.repository.getOrderByTrackingCode(trackingCode);
    if (!order) {
      throw new NotFoundException(`Tracking reference ${trackingCode} not found in system.`);
    }

    return {
      trackingCode: order.trackingCode,
      consignmentId: order.consignmentId,
      trackingLink: order.courierTrackingLink,
      status: order.status,
      courierDeliveryStatus: order.courierDeliveryStatus,
      courier: order.courierProvider,
      merchant: order.merchant.businessName,
      customerCity: order.city,
      codAmount: order.codAmount,
      updatedAt: order.updatedAt,
    };
  }

  // =========================================================================
  // INWARD COURIER WEBHOOK RECEIVER (VERIFIED + IDEMPOTENT + LOGGED)
  // =========================================================================

  async listWebhookLogs(rawProvider?: string, limit = 30) {
    const provider = rawProvider ? this.normalizeProvider(rawProvider) : undefined;
    return this.repository.listRecentWebhookLogs(provider, limit);
  }

  async processCourierWebhook(
    rawProvider: string,
    payload: any,
    rawBody?: Buffer | string,
    headers: Record<string, string | string[] | undefined> = {},
  ) {
    const provider = this.normalizeProvider(rawProvider);
    const adapter = this.adapterRegistry.getAdapter(provider);
    const integration = await this.repository.findIntegrationByProvider(provider);

    const idempotencyHeader =
      headers['idempotency-key'] || headers['Idempotency-Key'] || headers['x-idempotency-key'];
    const idempotencyKey = Array.isArray(idempotencyHeader)
      ? idempotencyHeader[0]
      : idempotencyHeader
      ? String(idempotencyHeader).trim()
      : null;

    // 1. Deduplicate retries via Idempotency-Key (per Steadfast webhook guide)
    if (idempotencyKey) {
      const existingLog = await this.repository.findWebhookLogByIdempotencyKey(idempotencyKey);
      if (existingLog) {
        return {
          status: 'success',
          duplicate: true,
          provider,
        };
      }
    }

    // 2. Verify X-Signature (HMAC-SHA256) / Authorization Bearer token
    const runtimeConfig = integration
      ? this.buildRuntimeConfig(integration)
      : {
          provider,
          baseUrl: adapter.defaultBaseUrl,
          isSandbox: false,
          credentials: {},
          webhookSecret: null,
        };

    const verification = adapter.verifyWebhook(runtimeConfig, rawBody, headers);
    const parsed = adapter.parseWebhook(payload);

    if (!verification.valid) {
      await this.repository.createWebhookLog({
        provider,
        idempotencyKey,
        notificationType: parsed.notificationType,
        consignmentId: parsed.consignmentId,
        invoice: parsed.invoice,
        rawStatus: parsed.rawStatus,
        mappedOrderStatus: parsed.mappedOrderStatus,
        signatureValid: false,
        processed: false,
        errorMessage: verification.reason || 'Invalid webhook signature',
        payload,
      });
      throw new UnauthorizedException(verification.reason || 'Invalid webhook signature');
    }

    // 3. Match order & apply updates
    const order = await this.repository.findOrderByCourierRefs({
      consignmentId: parsed.consignmentId,
      trackingCode: parsed.trackingCode,
      invoice: parsed.invoice,
    });

    let updatedOrderId: string | null = order?.id || null;
    if (order) {
      const shouldChangeStatus =
        Boolean(parsed.mappedOrderStatus) &&
        parsed.mappedOrderStatus !== (order.status as unknown as OrderStatus);

      const updated = await this.repository.updateOrderFromCourierEvent(order.id, {
        courierDeliveryStatus: parsed.rawStatus || undefined,
        status: shouldChangeStatus ? parsed.mappedOrderStatus : null,
        timelineEntry: {
          status: parsed.notificationType.toUpperCase(),
          provider,
          rawStatus: parsed.rawStatus,
          message:
            parsed.trackingMessage ||
            `Courier ${provider} webhook (${parsed.notificationType}): ${parsed.rawStatus || 'update'}`,
          timestamp: parsed.updatedAt || new Date().toISOString(),
        },
      });

      if (updated && shouldChangeStatus && parsed.mappedOrderStatus) {
        await this.applyOrderStatusSideEffects(
          updated,
          provider,
          parsed.mappedOrderStatus,
          parsed.isFinalSettlementStatus,
        );
      }
    }

    await this.repository.createWebhookLog({
      provider,
      idempotencyKey,
      notificationType: parsed.notificationType,
      consignmentId: parsed.consignmentId,
      invoice: parsed.invoice,
      orderId: updatedOrderId,
      rawStatus: parsed.rawStatus,
      mappedOrderStatus: parsed.mappedOrderStatus,
      signatureValid: true,
      processed: Boolean(order),
      errorMessage: order ? null : 'No matching order found for consignment/invoice',
      payload,
    });

    // Steadfast expects HTTP 200 with { status: 'success' }
    return {
      status: 'success',
      success: true,
      provider,
      orderId: updatedOrderId,
      notificationType: parsed.notificationType,
      newStatus: parsed.mappedOrderStatus,
    };
  }

  private async applyOrderStatusSideEffects(
    updated: any,
    provider: CourierProvider | string,
    orderStatus: OrderStatus,
    isFinalSettlementStatus: boolean,
  ) {
    const preDispatchStatuses = [
      OrderStatus.ALLOCATED,
      OrderStatus.PICKING,
      OrderStatus.PACKED,
      OrderStatus.ON_HOLD_FRAUD,
    ];
    const postDispatchStatuses = [
      OrderStatus.DISPATCHED,
      OrderStatus.DELIVERED,
      OrderStatus.PARTIAL_DELIVERED,
    ];
    const prev = updated.previousStatus as OrderStatus | undefined;

    if (
      prev &&
      preDispatchStatuses.includes(prev) &&
      postDispatchStatuses.includes(orderStatus) &&
      typeof this.inventoryService?.consumeReservedStockForOrder === 'function'
    ) {
      const items = (updated.items || [])
        .filter((it: any) => Boolean(it?.variantId))
        .map((it: any) => ({
          variantId: String(it.variantId),
          quantity: Math.max(1, Number(it.quantity) || 1),
        }));
      if (items.length > 0) {
        try {
          await this.inventoryService.consumeReservedStockForOrder(
            items,
            updated.merchantId,
            updated.id,
          );
        } catch (err: any) {
          console.warn('[ShippingService] Reserved stock consumption notice:', err?.message || err);
        }
      }
    } else if (
      prev &&
      preDispatchStatuses.includes(prev) &&
      orderStatus === OrderStatus.CANCELLED &&
      typeof this.inventoryService?.releaseReservedStock === 'function'
    ) {
      const items = (updated.items || [])
        .filter((it: any) => Boolean(it?.variantId))
        .map((it: any) => ({
          variantId: String(it.variantId),
          quantity: Math.max(1, Number(it.quantity) || 1),
        }));
      if (items.length > 0) {
        try {
          await this.inventoryService.releaseReservedStock(
            items,
            updated.merchantId,
            updated.id,
          );
        } catch (err: any) {
          console.warn('[ShippingService] Reserved stock release notice:', err?.message || err);
        }
      }
    }

    // Per Steadfast guide: only settle or reverse earnings on final confirmed statuses
    if (!isFinalSettlementStatus) return;

    try {
      if (orderStatus === OrderStatus.DELIVERED || orderStatus === OrderStatus.PARTIAL_DELIVERED) {
        await this.billingService.recordCompletedOrderEarning(updated.id);
      } else if (orderStatus === OrderStatus.RETURNED || orderStatus === OrderStatus.CANCELLED) {
        await this.billingService.reverseOrderEarning(
          updated.id,
          orderStatus === OrderStatus.RETURNED
            ? `Courier ${provider} marked order RETURNED — earning refunded`
            : `Courier ${provider} marked order CANCELLED — earning reversed`,
        );
      }
    } catch (err: any) {
      console.warn('[ShippingService] Billing earning sync notice:', err?.message || err);
    }
  }
}
