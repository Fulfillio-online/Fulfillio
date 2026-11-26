import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CourierConnectionStatus, CourierProvider, OrderStatus } from '@fulfillio/contracts';

const DEFAULT_INTEGRATIONS: Array<{
  provider: CourierProvider;
  displayName: string;
  baseUrl: string;
  insideDhakaRate: number;
  outsideDhakaRate: number;
  codChargePercent: number;
}> = [
  {
    provider: CourierProvider.STEADFAST,
    displayName: 'Steadfast Courier',
    baseUrl: 'https://portal.packzy.com/api/v1',
    insideDhakaRate: 60,
    outsideDhakaRate: 120,
    codChargePercent: 1,
  },
  {
    provider: CourierProvider.PATHAO,
    displayName: 'Pathao Logistics',
    baseUrl: 'https://api-hermes.pathao.com',
    insideDhakaRate: 60,
    outsideDhakaRate: 130,
    codChargePercent: 1,
  },
  {
    provider: CourierProvider.REDX,
    displayName: 'RedX Logistics',
    baseUrl: 'https://openapi.redx.com.bd/v1.0.0-beta',
    insideDhakaRate: 60,
    outsideDhakaRate: 120,
    codChargePercent: 1,
  },
];

@Injectable()
export class ShippingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaultIntegrations() {
    for (const def of DEFAULT_INTEGRATIONS) {
      await this.prisma.courierIntegration.upsert({
        where: { provider: def.provider as any },
        update: {},
        create: {
          provider: def.provider as any,
          displayName: def.displayName,
          baseUrl: def.baseUrl,
          status: CourierConnectionStatus.DISCONNECTED as any,
          isSandbox: false,
          insideDhakaRate: def.insideDhakaRate,
          outsideDhakaRate: def.outsideDhakaRate,
          codChargePercent: def.codChargePercent,
        },
      });
    }
  }

  async findAllIntegrations() {
    await this.ensureDefaultIntegrations();
    return this.prisma.courierIntegration.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findIntegrationByProvider(provider: CourierProvider) {
    await this.ensureDefaultIntegrations();
    return this.prisma.courierIntegration.findUnique({
      where: { provider: provider as any },
    });
  }

  async upsertIntegration(provider: CourierProvider, data: Record<string, any>) {
    const def = DEFAULT_INTEGRATIONS.find((d) => d.provider === provider);
    return this.prisma.courierIntegration.upsert({
      where: { provider: provider as any },
      update: data,
      create: {
        provider: provider as any,
        displayName: data.displayName || def?.displayName || provider,
        baseUrl: data.baseUrl || def?.baseUrl || '',
        ...data,
      },
    });
  }

  async updateIntegrationHealth(
    provider: CourierProvider,
    health: {
      lastHealthStatus: string;
      lastLatencyMs?: number | null;
      lastBalance?: number | null;
      lastError?: string | null;
      lastCheckedAt: Date;
      status?: CourierConnectionStatus;
    },
  ) {
    return this.prisma.courierIntegration.update({
      where: { provider: provider as any },
      data: {
        lastHealthStatus: health.lastHealthStatus,
        lastLatencyMs: health.lastLatencyMs ?? null,
        ...(health.lastBalance !== undefined ? { lastBalance: health.lastBalance } : {}),
        lastError: health.lastError ?? null,
        lastCheckedAt: health.lastCheckedAt,
        ...(health.status ? { status: health.status as any } : {}),
      },
    });
  }

  async countActiveConsignmentsByProvider(): Promise<Record<string, number>> {
    const grouped = await this.prisma.order.groupBy({
      by: ['courierProvider'],
      where: {
        courierProvider: { not: null },
        consignmentId: { not: null },
        status: { in: ['PACKED', 'DISPATCHED'] },
      },
      _count: { id: true },
    });

    const result: Record<string, number> = {};
    for (const row of grouped) {
      if (row.courierProvider) {
        result[row.courierProvider] = row._count.id;
      }
    }
    return result;
  }

  async findOrderForBooking(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        merchant: true,
      },
    });
  }

  async findOrdersForBulkBooking(orderIds: string[]) {
    return this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        merchant: true,
      },
    });
  }

  async assignCourier(
    orderId: string,
    provider: CourierProvider,
    trackingCode: string,
    consignmentId: string,
    trackingLink?: string | null,
    courierDeliveryStatus?: string | null,
  ) {
    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { timeline: true },
    });
    const timeline = Array.isArray(existing?.timeline) ? [...(existing.timeline as any[])] : [];
    timeline.push({
      status: 'COURIER_BOOKED',
      provider,
      consignmentId,
      trackingCode,
      message: `Booked with ${provider} (Consignment: ${consignmentId}, Tracking: ${trackingCode})`,
      timestamp: new Date().toISOString(),
    });

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        courierProvider: provider as any,
        trackingCode,
        consignmentId,
        courierTrackingLink: trackingLink ?? null,
        courierDeliveryStatus: courierDeliveryStatus ?? 'in_review',
        courierSyncedAt: new Date(),
        timeline,
      },
    });
  }

  async getManifestOrders(provider: CourierProvider) {
    return this.prisma.order.findMany({
      where: {
        courierProvider: provider as any,
        status: 'PACKED',
      },
      include: {
        merchant: true,
      },
    });
  }

  async getOrderByTrackingCode(trackingCode: string) {
    return this.prisma.order.findFirst({
      where: {
        OR: [{ trackingCode }, { consignmentId: trackingCode }],
      },
      include: {
        merchant: {
          select: {
            merchantCode: true,
            businessName: true,
          },
        },
        items: {
          include: {
            variant: true,
          },
        },
      },
    });
  }

  async findOrderByCourierRefs(refs: {
    trackingCode?: string | null;
    consignmentId?: string | null;
    invoice?: string | null;
  }) {
    const orClauses: any[] = [];
    if (refs.consignmentId) orClauses.push({ consignmentId: String(refs.consignmentId) });
    if (refs.trackingCode) orClauses.push({ trackingCode: String(refs.trackingCode) });
    if (refs.invoice) {
      orClauses.push({ id: String(refs.invoice) });
      orClauses.push({ externalOrderId: String(refs.invoice) });
    }
    if (orClauses.length === 0) return null;

    return this.prisma.order.findFirst({
      where: { OR: orClauses },
      include: { items: true },
    });
  }

  async updateOrderFromCourierEvent(
    orderId: string,
    opts: {
      courierDeliveryStatus?: string | null;
      status?: OrderStatus | null;
      timelineEntry?: Record<string, any>;
    },
  ) {
    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!existing) return null;

    const previousStatus = existing.status;
    const timeline = Array.isArray(existing.timeline) ? [...(existing.timeline as any[])] : [];
    if (opts.timelineEntry) {
      timeline.push(opts.timelineEntry);
    }

    const data: any = {
      courierSyncedAt: new Date(),
      timeline,
    };

    if (opts.courierDeliveryStatus) {
      data.courierDeliveryStatus = opts.courierDeliveryStatus;
    }

    if (opts.status) {
      data.status = opts.status;
      if (opts.status === OrderStatus.DELIVERED || opts.status === OrderStatus.PARTIAL_DELIVERED) {
        data.deliveredAt = new Date();
      } else if (opts.status === OrderStatus.RETURNED) {
        data.returnedAt = new Date();
      } else if (opts.status === OrderStatus.CANCELLED) {
        data.cancelledAt = new Date();
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: existing.id },
      data,
      include: { items: true },
    });

    return {
      ...updated,
      previousStatus,
    };
  }

  async findWebhookLogByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.courierWebhookLog.findUnique({
      where: { idempotencyKey },
    });
  }

  async createWebhookLog(data: {
    provider: CourierProvider;
    idempotencyKey?: string | null;
    notificationType?: string | null;
    consignmentId?: string | null;
    invoice?: string | null;
    orderId?: string | null;
    rawStatus?: string | null;
    mappedOrderStatus?: OrderStatus | null;
    signatureValid: boolean;
    processed: boolean;
    errorMessage?: string | null;
    payload: any;
  }) {
    return this.prisma.courierWebhookLog.create({
      data: {
        provider: data.provider as any,
        idempotencyKey: data.idempotencyKey || null,
        notificationType: data.notificationType || null,
        consignmentId: data.consignmentId || null,
        invoice: data.invoice || null,
        orderId: data.orderId || null,
        rawStatus: data.rawStatus || null,
        mappedOrderStatus: (data.mappedOrderStatus as any) || null,
        signatureValid: data.signatureValid,
        processed: data.processed,
        errorMessage: data.errorMessage || null,
        payload: data.payload ?? {},
      },
    });
  }

  async listRecentWebhookLogs(provider?: CourierProvider, limit = 30) {
    return this.prisma.courierWebhookLog.findMany({
      where: provider ? { provider: provider as any } : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
    });
  }
}
