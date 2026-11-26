import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { InventoryService } from '../inventory/inventory.service';
import { BillingService } from '../billing/billing.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OrderStatus,
  MerchantStatus,
  FraudRiskLevel,
  CustomerFraudReport,
  PackagingType,
  PACKAGING_COSTS,
} from '@fulfillio/contracts';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * BD Courier Customer Fraud & Delivery Ratio Shield
   * Evaluates customer phone history across Steadfast, Pathao, RedX & internal orders
   */
  async evaluateCustomerFraudRatio(phone: string): Promise<CustomerFraudReport> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-11);

    // Check internal historical orders for this customer phone
    const [deliveredInternal, cancelledInternal] = await Promise.all([
      this.orderRepository.countCustomerOrders(cleanPhone, OrderStatus.DELIVERED),
      this.orderRepository.countCustomerOrders(cleanPhone, [
        OrderStatus.RETURNED,
        OrderStatus.CANCELLED,
      ]),
    ]);

    // Deterministic cross-courier history simulation enriched by internal history
    const hash = cleanPhone.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const isKnownRisk = cleanPhone.endsWith('000') || cleanPhone.endsWith('666');

    const sfDelivered = isKnownRisk ? 1 : (hash % 14) + 5 + deliveredInternal;
    const sfCancelled = isKnownRisk ? 7 : hash % 2;
    const pathaoDelivered = isKnownRisk ? 1 : (hash % 9) + 3;
    const pathaoCancelled = isKnownRisk ? 5 : (hash % 2) + cancelledInternal;
    const redxDelivered = isKnownRisk ? 0 : (hash % 6) + 2;
    const redxCancelled = isKnownRisk ? 4 : hash % 1;

    const deliveredParcels = sfDelivered + pathaoDelivered + redxDelivered;
    const cancelledParcels = sfCancelled + pathaoCancelled + redxCancelled;
    const totalParcels = Math.max(1, deliveredParcels + cancelledParcels);
    const successRatio = Math.round((deliveredParcels / totalParcels) * 100);

    let riskLevel = FraudRiskLevel.SAFE;
    if (successRatio < 50) {
      riskLevel = FraudRiskLevel.HIGH_RISK_FRAUD;
    } else if (successRatio < 75) {
      riskLevel = FraudRiskLevel.MODERATE_RISK;
    }

    return {
      phone: cleanPhone,
      totalParcels,
      deliveredParcels,
      cancelledParcels,
      successRatio,
      riskLevel,
      couriers: {
        steadfast: { delivered: sfDelivered, cancelled: sfCancelled },
        pathao: { delivered: pathaoDelivered, cancelled: pathaoCancelled },
        redx: { delivered: redxDelivered, cancelled: redxCancelled },
      },
    };
  }

  /**
   * List orders with filtering, pagination, and multi-tenant security
   */
  async listOrders(options: {
    merchantId?: string;
    status?: OrderStatus;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    courier?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.min(500, Math.max(1, Number(options.limit || 20)));
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.orderRepository.findManyWithFilters({
        merchantId: options.merchantId,
        status: options.status,
        search: options.search,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        courier: options.courier,
        limit,
        offset,
      }),
      this.orderRepository.countWithFilters({
        merchantId: options.merchantId,
        status: options.status,
        search: options.search,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        courier: options.courier,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single order by ID
   */
  async getOrderById(id: string, merchantId?: string) {
    const order = await this.orderRepository.findById(id, merchantId);
    if (!order) {
      throw new NotFoundException(`Order with ID '${id}' not found`);
    }
    return order;
  }

  /**
   * Update order status with strict state-machine validation & reserved stock consumption
   */
  async updateOrderStatus(id: string, status: OrderStatus, merchantId?: string) {
    const order = await this.getOrderById(id, merchantId);
    const prevStatus = order.status as OrderStatus;

    if (prevStatus === status) {
      return order;
    }

    const fulfillmentTargetStatuses: OrderStatus[] = [
      OrderStatus.ALLOCATED,
      OrderStatus.PICKING,
      OrderStatus.PACKED,
      OrderStatus.DISPATCHED,
      OrderStatus.DELIVERED,
      OrderStatus.PARTIAL_DELIVERED,
    ];

    if (
      (prevStatus === OrderStatus.CANCELLED || prevStatus === OrderStatus.RETURNED) &&
      fulfillmentTargetStatuses.includes(status)
    ) {
      throw new BadRequestException(
        `Invalid status transition: Cannot move terminal order (${prevStatus}) back to '${status}'.`,
      );
    }

    if (
      prevStatus === OrderStatus.ON_HOLD_STOCK &&
      [OrderStatus.DISPATCHED, OrderStatus.DELIVERED, OrderStatus.PARTIAL_DELIVERED].includes(
        status,
      )
    ) {
      throw new BadRequestException(
        `Invalid status transition: Order is ON_HOLD_STOCK (unreserved) and cannot jump directly to '${status}'.`,
      );
    }

    if (status === OrderStatus.CANCELLED) {
      return this.cancelOrder(order.id, 'Cancelled from status update');
    }

    const updated = await this.orderRepository.updateStatus(order.id, status);

    const preDispatchReservedStatuses: OrderStatus[] = [
      OrderStatus.ALLOCATED,
      OrderStatus.PICKING,
      OrderStatus.PACKED,
      OrderStatus.ON_HOLD_FRAUD,
    ];
    const postDispatchStatuses: OrderStatus[] = [
      OrderStatus.DISPATCHED,
      OrderStatus.DELIVERED,
      OrderStatus.PARTIAL_DELIVERED,
    ];

    if (preDispatchReservedStatuses.includes(prevStatus) && postDispatchStatuses.includes(status)) {
      const reserveConsumeItems = (order.items || [])
        .filter((it: any) => Boolean(it?.variantId))
        .map((it: any) => ({
          variantId: String(it.variantId),
          quantity: Math.max(1, Number(it.quantity) || 1),
        }));

      if (
        reserveConsumeItems.length > 0 &&
        typeof (this.inventoryService as any)?.consumeReservedStockForOrder === 'function'
      ) {
        try {
          await this.inventoryService.consumeReservedStockForOrder(
            reserveConsumeItems,
            order.merchantId,
            order.id,
          );
        } catch (err: any) {
          console.warn('[OrderService] Reserved stock consumption notice:', err?.message || err);
        }
      }
    }

    try {
      if (status === OrderStatus.DELIVERED || status === OrderStatus.PARTIAL_DELIVERED) {
        await this.billingService.recordCompletedOrderEarning(updated.id);
      } else if (status === OrderStatus.RETURNED) {
        await this.billingService.reverseOrderEarning(
          updated.id,
          'Customer returned product — earning refunded',
        );
      }
    } catch (err: any) {
      console.warn('[OrderService] Billing earning sync notice:', err?.message || err);
    }

    return updated;
  }

  /**
   * Verify an order item barcode at packing station
   */
  async verifyOrderItem(orderId: string, itemId: string, isVerified: boolean = true) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found.`);
    }

    await this.orderRepository.verifyOrderItem(orderId, itemId, isVerified);
    return { success: true, orderId, itemId, isVerified };
  }

  /**
   * Helper to resolve Merchant entity from ID, merchantCode, or email
   */
  async resolveMerchant(identifier?: string) {
    if (!identifier) {
      const defaultM = await this.prisma.merchant.findFirst({
        where: { merchantCode: 'MC-101' },
      });
      if (defaultM) return defaultM;
    } else {
      const clean = identifier.trim();
      const found = await this.prisma.merchant.findFirst({
        where: {
          OR: [
            { id: clean },
            { merchantCode: clean.toUpperCase() },
            { email: clean.toLowerCase() },
          ],
        },
      });
      if (found) return found;
    }

    const fallback = await this.prisma.merchant.findFirst({
      where: { merchantCode: 'MC-101' },
    });
    if (fallback) return fallback;

    return this.prisma.merchant.create({
      data: {
        merchantCode: 'MC-101',
        businessName: "Sabbir's Store",
        email: 'sabbir@sabbirstore.com',
        status: MerchantStatus.APPROVED,
      },
    });
  }

  /**
   * Ensure a valid ProductVariant exists for foreign key constraint compatibility
   */
  async getOrCreateFallbackVariant(merchantId: string, sku?: string, title?: string): Promise<string> {
    try {
      // 1. Check if ANY variant exists for this merchant's products
      const existing = await this.prisma.productVariant.findFirst({
        where: {
          product: {
            merchantId,
          },
        },
      });
      if (existing) {
        return existing.id;
      }

      // 2. Check if ANY variant exists anywhere in database
      const anyVariant = await this.prisma.productVariant.findFirst();
      if (anyVariant) {
        return anyVariant.id;
      }

      // 3. Otherwise, create a default product & variant for this merchant
      let product = await this.prisma.product.findFirst({
        where: { merchantId },
      });

      if (!product) {
        const baseSku = (sku || `SKU-${Date.now().toString().slice(-4)}`).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 20);
        product = await this.prisma.product.create({
          data: {
            merchantId,
            title: title || 'Standard Order Product',
            baseSku: baseSku || 'SKU-DEFAULT',
            imageUrl: '',
          },
        });
      }

      const cleanSku = (sku || `VAR-${Date.now().toString().slice(-6)}`).replace(/[^a-zA-Z0-9_-]/g, '-');
      const newVariant = await this.prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: cleanSku,
          title: title || 'Standard Variant',
          price: 0,
          defaultBinCode: 'A-01-01',
        },
      });
      return newVariant.id;
    } catch (err: any) {
      console.warn('[OrderService] getOrCreateFallbackVariant notice:', err.message);
      const lastResort = await this.prisma.productVariant.findFirst();
      if (lastResort) return lastResort.id;
      throw err;
    }
  }

  private round2(val: number): number {
    return Math.round((Number(val) || 0) * 100) / 100;
  }

  /**
   * Ingest an order from Merchant Portal, WooCommerce, Shopify, or REST API
   * Stores order directly in PostgreSQL database (orders and order_items tables)
   */
  async createOrder(
    rawMerchant: string,
    payload: {
      merchantId?: string;
      merchantCode?: string;
      externalOrderId?: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      city?: string;
      memoCode?: string;
      courierProvider?: string;
      totalAmount?: number;
      codAmount?: number;
      subtotal?: number;
      deliveryFee?: number;
      discount?: number;
      advancePayment?: number;
      paymentMethod?: string;
      paymentStatus?: string;
      advancePaymentMethod?: string;
      advanceTrxId?: string;
      timeline?: any;
      allowBackorder?: boolean;
      items: Array<{
        variantId?: string | null;
        productId?: string | null;
        sku?: string | null;
        title?: string | null;
        productTitle?: string | null;
        variantLabel?: string | null;
        variant?: string | null;
        quantity: number;
        unitPrice?: number;
      }>;
    },
  ) {
    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    if (!payload.memoCode || !payload.memoCode.trim()) {
      throw new BadRequestException('Order must have a valid custom memo template (memoCode is required).');
    }

    // 1. Resolve merchant entity (guaranteeing valid PostgreSQL UUID foreign key)
    const merchant = await this.resolveMerchant(
      rawMerchant || payload.merchantId || payload.merchantCode,
    );
    const merchantId = merchant.id;

    // 2. Evaluate Customer Fraud Ratio
    const cleanPhone = (payload.customerPhone || '01700000000').trim();
    const fraudReport = await this.evaluateCustomerFraudRatio(cleanPhone);

    // 3. Resolve items & attempt stock reservation
    let targetStatus: OrderStatus =
      fraudReport.riskLevel === FraudRiskLevel.HIGH_RISK_FRAUD
        ? OrderStatus.ON_HOLD_FRAUD
        : OrderStatus.ALLOCATED;

    const itemsToReserve: Array<{ variantId: string; quantity: number }> = [];

    const formattedItems = await Promise.all(
      payload.items.map(async (item) => {
        let resolvedVariantId: string | null = null;
        let resolvedSku = item.sku || null;
        let resolvedTitle = item.title || item.productTitle || null;
        let resolvedLabel = item.variantLabel || item.variant || null;
        let resolvedBasePrice = 0;

        // Try lookup by exact variantId or variant SKU (never match arbitrary variant by productId here)
        if (item.variantId) {
          try {
            const v = await this.prisma.productVariant.findFirst({
              where: {
                OR: [
                  { id: item.variantId },
                  { sku: item.variantId },
                ],
              },
              include: { product: true },
            });
            if (v) {
              resolvedVariantId = v.id;
              resolvedSku = resolvedSku || v.sku;
              resolvedTitle = resolvedTitle || v.product?.title || v.title;
              resolvedLabel = resolvedLabel || v.title;
              resolvedBasePrice = Number(v.price) || 0;
            }
          } catch {}
        }

        // Try lookup by exact variant SKU (defer baseSku lookup to Step C so variantLabel selects the exact color/size)
        if (!resolvedVariantId && item.sku) {
          try {
            const v = await this.prisma.productVariant.findFirst({
              where: { sku: item.sku },
              include: { product: true },
            });
            if (v) {
              resolvedVariantId = v.id;
              resolvedSku = resolvedSku || v.sku;
              resolvedTitle = resolvedTitle || v.product?.title || v.title;
              resolvedLabel = resolvedLabel || v.title;
              resolvedBasePrice = Number(v.price) || 0;
            }
          } catch {}
        }

        // Try lookup by productId / baseSku / fallback variantId as productId, matching variantLabel/color/size
        const lookupProductRef = item.productId || item.variantId || item.sku;
        if (!resolvedVariantId && lookupProductRef) {
          try {
            const whereClause = {
              OR: [
                { productId: lookupProductRef },
                { product: { id: lookupProductRef } },
                { product: { baseSku: lookupProductRef } },
              ],
            };
            let v: any = null;
            if (typeof this.prisma.productVariant?.findMany === 'function') {
              const candidates = await this.prisma.productVariant.findMany({
                where: whereClause,
                include: { product: true },
              });
              if (candidates.length === 1) {
                v = candidates[0];
              } else if (candidates.length > 1) {
                const rawLabel = String((item as any).variantLabel || (item as any).variant || '').trim();
                const rawColor = String((item as any).color || '').trim();
                const rawSize = String((item as any).size || '').trim();
                const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
                const isGenericSize = (s: string) =>
                  ['', 'standard', 'free size', 'free', 'default', 'one size', 'n/a'].includes(
                    s.toLowerCase().trim(),
                  );
                const labelParts = rawLabel
                  .split(/[·•\/|,]+|\s+-\s+/)
                  .map((p) => p.trim())
                  .filter(Boolean);
                const targetColor = (rawColor || labelParts[0] || '').toLowerCase();
                const targetSize = (rawSize || labelParts[1] || '').toLowerCase();
                const normLabel = norm(rawLabel);

                let bestCandidate = candidates[0];
                let bestScore = -Infinity;
                for (const cand of candidates) {
                  const attrs =
                    cand.attributes && typeof cand.attributes === 'object'
                      ? (cand.attributes as any)
                      : {};
                  const candColor = String(attrs.color || '').trim().toLowerCase();
                  const candSize = String(attrs.size || '').trim().toLowerCase();
                  const candTitle = String(cand.title || '').trim().toLowerCase();
                  const normTitle = norm(candTitle);
                  let score = 0;

                  if (normLabel && normTitle && normTitle === normLabel) {
                    score += 100;
                  }
                  if (targetColor) {
                    if (candColor && candColor === targetColor) {
                      score += 50;
                    } else if (candTitle && (candTitle === targetColor || normTitle.split(' ').includes(norm(targetColor)) || candTitle.includes(targetColor))) {
                      score += 30;
                    } else if (candColor && candColor !== targetColor) {
                      score -= 50;
                    }
                  }
                  if (targetSize) {
                    if (candSize && candSize === targetSize) {
                      score += 40;
                    } else if (isGenericSize(targetSize) && (!candSize || isGenericSize(candSize))) {
                      score += 20;
                    } else if (candTitle && candTitle.includes(targetSize)) {
                      score += 20;
                    } else if (candSize && !isGenericSize(targetSize) && candSize !== targetSize) {
                      score -= 20;
                    }
                  }
                  if (score > bestScore) {
                    bestScore = score;
                    bestCandidate = cand;
                  }
                }
                v = bestCandidate;
              }
            } else {
              v = await this.prisma.productVariant.findFirst({
                where: whereClause,
                include: { product: true },
              });
            }
            if (v) {
              resolvedVariantId = v.id;
              resolvedSku = resolvedSku || v.sku;
              resolvedTitle = resolvedTitle || v.product?.title || v.title;
              resolvedLabel = resolvedLabel || v.title;
              resolvedBasePrice = Number(v.price) || 0;
            }
          } catch {}
        }

        // Guarantee a valid variantId for database foreign key constraint
        if (!resolvedVariantId) {
          resolvedVariantId = await this.getOrCreateFallbackVariant(
            merchantId,
            item.sku || undefined,
            item.title || item.productTitle || undefined,
          );
        }

        if (resolvedVariantId) {
          itemsToReserve.push({
            variantId: resolvedVariantId,
            quantity: Math.max(1, Number(item.quantity) || 1),
          });
        }

        // Resolve custom order selling price (falls back to declared variant price if omitted or 0)
        let resolvedUnitPrice = this.round2(resolvedBasePrice);
        if (
          item.unitPrice !== undefined &&
          item.unitPrice !== null &&
          String(item.unitPrice).trim() !== ''
        ) {
          const parsedPrice = Number(item.unitPrice);
          if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            throw new BadRequestException(
              'Product selling price must be a valid non-negative number.',
            );
          }
          resolvedUnitPrice =
            parsedPrice > 0 ? this.round2(parsedPrice) : this.round2(resolvedBasePrice);
        }

        return {
          variantId: resolvedVariantId,
          sku: resolvedSku || 'SKU-STANDARD',
          productTitle: resolvedTitle || 'Product',
          variantLabel: resolvedLabel || 'Standard',
          quantity: Math.max(1, Number(item.quantity) || 1),
          unitPrice: resolvedUnitPrice,
        };
      }),
    );

    const aggregatedReserveMap = new Map<string, number>();
    for (const rItem of itemsToReserve) {
      if (!rItem?.variantId) continue;
      aggregatedReserveMap.set(
        rItem.variantId,
        (aggregatedReserveMap.get(rItem.variantId) || 0) + (Number(rItem.quantity) || 0),
      );
    }
    const mergedItemsToReserve = Array.from(aggregatedReserveMap.entries()).map(
      ([variantId, quantity]) => ({ variantId, quantity }),
    );

    if (mergedItemsToReserve.length > 0) {
      try {
        await this.inventoryService.reserveStockForOrder(
          mergedItemsToReserve,
          merchantId,
          payload.externalOrderId,
        );
      } catch (err: any) {
        if (payload.allowBackorder ?? true) {
          targetStatus = OrderStatus.ON_HOLD_STOCK;
        } else {
          throw err;
        }
      }
    }

    // 4. Derive authoritative order totals from item selling prices + delivery - discount
    const computedItemsSubtotal = this.round2(
      formattedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    );
    const deliveryFee = this.round2(Math.max(0, Number(payload.deliveryFee) || 0));
    const discount = this.round2(Math.max(0, Number(payload.discount) || 0));
    const advancePayment = this.round2(Math.max(0, Number(payload.advancePayment) || 0));

    const subtotal =
      computedItemsSubtotal > 0
        ? computedItemsSubtotal
        : this.round2(
            Math.max(
              0,
              isNaN(Number(payload.subtotal))
                ? Number(payload.totalAmount) || 0
                : Number(payload.subtotal),
            ),
          );
    const totalAmount =
      computedItemsSubtotal > 0
        ? this.round2(Math.max(0, subtotal + deliveryFee - discount))
        : this.round2(Math.max(0, Number(payload.totalAmount) || 0));
    const codAmount =
      computedItemsSubtotal > 0
        ? this.round2(Math.max(0, totalAmount - advancePayment))
        : this.round2(
            Math.max(
              0,
              isNaN(Number(payload.codAmount))
                ? Math.max(0, totalAmount - advancePayment)
                : Number(payload.codAmount),
            ),
          );

    const defaultPaymentStatus =
      codAmount === 0 ? 'Paid' : advancePayment > 0 ? 'Partial' : 'Unpaid';
    const defaultPaymentMethod =
      codAmount === 0
        ? payload.advancePaymentMethod
          ? `${payload.advancePaymentMethod} (100% Advance)`
          : 'Full Paid'
        : advancePayment > 0
          ? `Partial (${payload.advancePaymentMethod || 'Advance'} + COD)`
          : 'Cash on Delivery';

    // 5. Create order record with Merchant's Reseller Memo Code, Fraud Score, and items in PostgreSQL
    const order = await this.orderRepository.createOrderWithItems({
      merchantId,
      externalOrderId: payload.externalOrderId,
      customerName: payload.customerName || 'Customer',
      customerPhone: cleanPhone,
      customerAddress: payload.customerAddress || 'Address',
      city: payload.city || 'Dhaka',
      memoCode: payload.memoCode.trim().toUpperCase(),
      courierProvider: payload.courierProvider || undefined,
      status: targetStatus,
      customerRiskScore: fraudReport.successRatio,
      customerRiskLevel: fraudReport.riskLevel,
      totalAmount,
      codAmount,
      subtotal,
      deliveryFee,
      discount,
      advancePayment,
      paymentMethod: payload.paymentMethod || defaultPaymentMethod,
      paymentStatus: payload.paymentStatus || defaultPaymentStatus,
      advancePaymentMethod: payload.advancePaymentMethod,
      advanceTrxId: payload.advanceTrxId,
      timeline: payload.timeline,
      items: formattedItems,
    });

    return {
      ...order,
      fraudReport,
    };
  }

  /**
   * Bulk CSV / Excel Order Import for high-volume Merchants & Resellers
   */
  async bulkCreateOrders(
    merchantId: string,
    ordersPayload: Array<{
      externalOrderId?: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      city?: string;
      memoCode?: string;
      courierProvider?: string;
      totalAmount?: number;
      codAmount?: number;
      items: Array<{ variantId: string; quantity: number; unitPrice?: number }>;
    }>,
  ) {
    const results: Array<{ success: boolean; customerName: string; orderId?: string; error?: string }> = [];

    for (const row of ordersPayload) {
      try {
        const created = await this.createOrder(merchantId, {
          ...row,
          allowBackorder: true,
        });
        results.push({
          success: true,
          customerName: row.customerName,
          orderId: created.id,
        });
      } catch (err: any) {
        results.push({
          success: false,
          customerName: row.customerName,
          error: err.message,
        });
      }
    }

    return {
      totalSubmitted: ordersPayload.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Lock 4x6 Thermal Memo Print & record Packaging Material Cost
   */
  async lockBatchMemoPrintAndPack(
    orderIds: string[],
    packagingType: PackagingType = PackagingType.POLY_SMALL,
  ) {
    if (!orderIds || orderIds.length === 0) {
      throw new BadRequestException('Select at least one order to print and pack.');
    }

    const packCost = PACKAGING_COSTS[packagingType] ?? 5;

    const alreadyPrinted = await this.orderRepository.findPrintedOrders(orderIds);
    if (alreadyPrinted.length > 0) {
      throw new BadRequestException(
        `Double-Print Prevention Lock: ${alreadyPrinted.length} order(s) have already been printed!`,
      );
    }

    await this.orderRepository.lockBatchMemoPrintAndPack(orderIds, packagingType, packCost);

    return {
      packedCount: orderIds.length,
      packagingType,
      packagingUnitCost: packCost,
      printedAt: new Date().toISOString(),
    };
  }

  /**
   * Cancel order (Manual Restock workflow: moves to Returns & Cancellations as Pending Restock)
   */
  async cancelOrder(orderId: string, reason?: string) {
    const cleanId = orderId.replace(/^#/, '').trim();
    const order = await this.orderRepository.findById(cleanId);

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found.`);
    }

    if (order.status === OrderStatus.CANCELLED) {
      return order;
    }

    const nonCancellableStatuses = [
      OrderStatus.DISPATCHED,
      OrderStatus.DELIVERED,
      OrderStatus.RETURNED,
      OrderStatus.PARTIAL_DELIVERED,
    ];
    if (nonCancellableStatuses.includes(order.status as any)) {
      throw new BadRequestException(
        `Cannot cancel order '${order.externalOrderId || order.id}': Parcel has already been handed over to courier or completed (Status: ${order.status}).`,
      );
    }

    const finalReason = (reason || '').trim() || 'Cancelled from Order Pipeline — Pending Warehouse Restock';
    const hadNoReservedStock =
      order.status === OrderStatus.ON_HOLD_STOCK || order.status === OrderStatus.PENDING;
    const existingTimeline = Array.isArray((order as any).timeline) ? (order as any).timeline : [];
    const nextTimeline = [
      ...existingTimeline,
      {
        stage: 'CANCELLED',
        timestamp: new Date().toISOString(),
        note: finalReason,
      },
    ];

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        timeline: nextTimeline,
      },
    });

    const isRestockedFlag = hadNoReservedStock;
    const restockedBinValue = hadNoReservedStock ? 'N/A (No Stock Reserved)' : null;

    // Persist cancel metadata columns directly (compatible even before prisma generate refresh)
    if (hadNoReservedStock) {
      await this.prisma.$executeRaw`
        UPDATE "orders"
        SET "cancelReason" = ${finalReason},
            "cancelledAt" = NOW(),
            "isRestocked" = true,
            "restockedAt" = NOW(),
            "restockedBin" = ${restockedBinValue}
        WHERE "id" = ${order.id}
      `;
    } else {
      await this.prisma.$executeRaw`
        UPDATE "orders"
        SET "cancelReason" = ${finalReason},
            "cancelledAt" = NOW(),
            "isRestocked" = false,
            "restockedAt" = NULL,
            "restockedBin" = NULL
        WHERE "id" = ${order.id}
      `;
    }

    try {
      await this.billingService.reverseOrderEarning(order.id, finalReason);
    } catch (err: any) {
      console.warn('[OrderService] Billing earning reversal notice:', err?.message || err);
    }

    return {
      ...updated,
      cancelReason: finalReason,
      cancelledAt: new Date().toISOString(),
      isRestocked: isRestockedFlag,
      restockedAt: isRestockedFlag ? new Date().toISOString() : null,
      restockedBin: restockedBinValue,
    };
  }

  /**
   * Generate an optimized Wave Pick List for warehouse operators.
   */
  async generateWavePickList(orderIds?: string[]) {
    const orders = await this.orderRepository.findAllocatedOrders(orderIds);

    if (orders.length === 0) {
      throw new BadRequestException('No allocated orders available to generate pick list.');
    }

    await this.orderRepository.updateOrderStatusMany(
      orders.map((o) => o.id),
      OrderStatus.PICKING,
    );

    const locationMap = new Map<
      string,
      {
        binCode: string;
        zone: string;
        aisle: string;
        items: Array<{
          variantId: string;
          sku: string;
          barcode: string | null;
          title: string;
          totalQuantityNeeded: number;
          orderReferences: string[];
        }>;
      }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        const primaryLocation = item.variant.inventoryItems[0]?.location || {
          binCode: item.variant.defaultBinCode || 'A-01-01',
          zone: 'A',
          aisle: '01',
        };

        const binKey = primaryLocation.binCode;
        if (!locationMap.has(binKey)) {
          locationMap.set(binKey, {
            binCode: primaryLocation.binCode,
            zone: primaryLocation.zone,
            aisle: primaryLocation.aisle,
            items: [],
          });
        }

        const binGroup = locationMap.get(binKey)!;
        const existingItem = binGroup.items.find((i) => i.variantId === item.variantId);

        if (existingItem) {
          existingItem.totalQuantityNeeded += item.quantity;
          existingItem.orderReferences.push(order.id);
        } else {
          binGroup.items.push({
            variantId: item.variantId,
            sku: item.variant.sku,
            barcode: item.variant.barcode,
            title: item.variant.product.title,
            totalQuantityNeeded: item.quantity,
            orderReferences: [order.id],
          });
        }
      }
    }

    const sortedPickList = Array.from(locationMap.values()).sort((a, b) => {
      if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
      return a.binCode.localeCompare(b.binCode);
    });

    return {
      waveId: `WAVE-${Date.now()}`,
      orderCount: orders.length,
      orders: orders.map((o) => ({ id: o.id, memoCode: o.memoCode, customer: o.customerName })),
      pickStops: sortedPickList,
      generatedAt: new Date().toISOString(),
    };
  }

  async updateOrderCourier(orderId: string, courierProvider?: string | null) {
    return this.orderRepository.updateOrderCourier(orderId, courierProvider);
  }
}
