import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  AdminFinanceAnalyticsDto,
  AdminOperationsActivityDto,
  AdminOperationsCourierDto,
  AdminOperationsDashboardDto,
  AdminOperationsZoneCapacityDto,
  CompanyFinanceEntryDto,
  EarningsChartBucketDto,
  EarningsChartPeriod,
  FinanceEntryCategory,
  FinanceEntryType,
  FinanceMerchantBreakdownDto,
  FinanceTimeframePreset,
  FinanceTimeSeriesBucketDto,
  MerchantEarningsDashboardDto,
  OrderEarningDto,
  OrderEarningStatus,
  PayoutMethod,
  PayoutRequestDto,
  PayoutRequestStatus,
  UserRole,
} from '@fulfillio/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingRepository } from './billing.repository';

const DAY_MS = 24 * 60 * 60 * 1000;
const VALID_PAYOUT_METHODS = new Set<string>(Object.values(PayoutMethod));
const VALID_FINANCE_TYPES = new Set<string>(Object.values(FinanceEntryType));
const VALID_EXPENSE_CATEGORIES = new Set<string>([
  FinanceEntryCategory.RENT,
  FinanceEntryCategory.SALARY,
  FinanceEntryCategory.COURIER_COST,
  FinanceEntryCategory.PACKAGING_PURCHASE,
  FinanceEntryCategory.UTILITY_MISC,
]);
const VALID_INCOME_CATEGORIES = new Set<string>([
  FinanceEntryCategory.STORAGE_FEE,
  FinanceEntryCategory.OTHER_INCOME,
]);

const EXPENSE_CATEGORY_META: Array<{
  category: FinanceEntryCategory;
  label: string;
}> = [
  { category: FinanceEntryCategory.RENT, label: 'Warehouse & Office Rent' },
  { category: FinanceEntryCategory.SALARY, label: 'Staff Payroll & Salaries' },
  { category: FinanceEntryCategory.COURIER_COST, label: 'Courier Bill Settlement' },
  { category: FinanceEntryCategory.PACKAGING_PURCHASE, label: 'Packaging Materials' },
  { category: FinanceEntryCategory.UTILITY_MISC, label: 'Utilities, Tech & Misc' },
];

@Injectable()
export class BillingService {
  constructor(
    private readonly repository: BillingRepository,
    private readonly prisma: PrismaService,
  ) {}

  private round2(val: number): number {
    return Math.round((Number(val) || 0) * 100) / 100;
  }

  private computeOrderEarningNumbers(order: any, merchant: any) {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsSum = this.round2(
      items.reduce(
        (sum: number, item: any) =>
          sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
        0,
      ),
    );

    const deliveryFee = this.round2(Math.max(0, Number(order.deliveryFee) || 0));
    const discount = this.round2(Math.max(0, Number(order.discount) || 0));
    const computedFromItems =
      itemsSum > 0 ? this.round2(Math.max(0, itemsSum + deliveryFee - discount)) : 0;

    const rawTotal = Number(order.totalAmount) || 0;
    const rawCod = Number(order.codAmount) || 0;
    const orderBill = this.round2(
      computedFromItems > 0 ? computedFromItems : rawTotal > 0 ? rawTotal : rawCod,
    );

    const advancePayment = this.round2(Math.max(0, Number(order.advancePayment) || 0));
    const codCollected =
      advancePayment > 0 ? this.round2(Math.max(0, orderBill - advancePayment)) : orderBill;
    const grossAmount = codCollected;

    const handlingFee = this.round2(Number(merchant?.baseHandlingFee) || 0);
    const packagingFee = this.round2(Number(order.packagingCost) || 0);
    const feeAmount = this.round2(deliveryFee + handlingFee + packagingFee);
    const netAmount =
      advancePayment > 0
        ? this.round2(grossAmount - feeAmount)
        : this.round2(Math.max(0, grossAmount - feeAmount));

    const itemSummary =
      items.length > 0
        ? items
            .map((it: any) => {
              const title = it.productTitle || 'Order Item';
              const variant =
                it.variantLabel && it.variantLabel !== 'Standard'
                  ? ` (${it.variantLabel})`
                  : '';
              const unitPrice = Number(it.unitPrice) || 0;
              const priceSuffix =
                unitPrice > 0 ? ` (@৳${unitPrice.toLocaleString()})` : '';
              return `${title}${variant} x ${it.quantity || 1}${priceSuffix}`;
            })
            .join(', ')
        : `Order ${order.externalOrderId || order.id}`;

    const orderNumber = String(order.externalOrderId || order.id || '').replace(/^#/, '');
    const cleanRefBase = orderNumber.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    const transactionRef = `TXN-${cleanRefBase || order.id.slice(0, 8).toUpperCase()}`;

    return {
      transactionRef,
      orderNumber,
      itemSummary,
      grossAmount,
      deliveryFee,
      handlingFee,
      packagingFee,
      feeAmount,
      netAmount,
    };
  }

  private mapEarningToDto(e: any, nowMs: number = Date.now()): OrderEarningDto {
    const claimableAtDate = new Date(e.claimableAt);
    const remainingMs = Math.max(0, claimableAtDate.getTime() - nowMs);
    return {
      id: e.id,
      transactionRef: e.transactionRef,
      merchantId: e.merchantId,
      merchantCode: e.merchant?.merchantCode,
      merchantName: e.merchant?.businessName,
      orderId: e.orderId,
      orderNumber: e.orderNumber,
      customerName: e.order?.customerName,
      itemSummary: e.itemSummary,
      grossAmount: Number(e.grossAmount),
      deliveryFee: Number(e.deliveryFee),
      handlingFee: Number(e.handlingFee),
      packagingFee: Number(e.packagingFee),
      feeAmount: Number(e.feeAmount),
      netAmount: Number(e.netAmount),
      status: e.status as OrderEarningStatus,
      returnWindowDays: Number(e.returnWindowDays) || 3,
      completedAt: new Date(e.completedAt).toISOString(),
      claimableAt: claimableAtDate.toISOString(),
      claimedAt: e.claimedAt ? new Date(e.claimedAt).toISOString() : undefined,
      refundedAt: e.refundedAt ? new Date(e.refundedAt).toISOString() : undefined,
      refundReason: e.refundReason || undefined,
      releasedByAdmin: Boolean(e.releasedByAdmin),
      remainingMs,
      isReturnWindowOver: remainingMs === 0,
    };
  }

  private mapPayoutRequestToDto(r: any): PayoutRequestDto {
    return {
      id: r.id,
      requestCode: r.requestCode,
      merchantId: r.merchantId,
      merchantCode: r.merchant?.merchantCode || '',
      merchantName: r.merchant?.businessName || 'Merchant',
      ownerName: r.accountHolder || r.merchant?.ownerName || 'Store Owner',
      amount: Number(r.amount),
      method: r.method as PayoutMethod,
      provider: r.provider,
      accountNumber: r.accountNumber,
      accountHolder: r.accountHolder || undefined,
      branchName: r.branchName || undefined,
      routingNumber: r.routingNumber || undefined,
      remarks: r.remarks || undefined,
      status: r.status as PayoutRequestStatus,
      rejectionReason: r.rejectionReason || undefined,
      requestedAt: new Date(r.requestedAt).toISOString(),
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : undefined,
      trxId: r.trxId || undefined,
      proofDocumentUrl: r.proofDocumentUrl || undefined,
      proofDocumentName: r.proofDocumentName || undefined,
      proofDocumentMime: r.proofDocumentMime || undefined,
      proofChannel: r.proofChannel || undefined,
      proofNotes: r.proofNotes || undefined,
      proofChecksum: r.proofChecksum || undefined,
      paidAt: r.paidAt ? new Date(r.paidAt).toISOString() : undefined,
      paidByAdminName: r.paidByAdminName || undefined,
    };
  }

  private computeBalances(earnings: any[], payoutRequests: any[], settlements: any[] = []) {
    const pendingEarnings = this.round2(
      earnings
        .filter((e) => e.status === 'PENDING')
        .reduce((sum, e) => sum + Number(e.netAmount), 0),
    );
    const readyToClaim = this.round2(
      earnings
        .filter((e) => e.status === 'READY_TO_CLAIM')
        .reduce((sum, e) => sum + Number(e.netAmount), 0),
    );
    const totalClaimed = this.round2(
      earnings
        .filter((e) => e.status === 'CLAIMED')
        .reduce((sum, e) => sum + Number(e.netAmount), 0),
    );
    const totalRefunded = this.round2(
      earnings
        .filter((e) => e.status === 'REFUNDED')
        .reduce((sum, e) => sum + Number(e.netAmount), 0),
    );

    const upcomingPayout = this.round2(
      payoutRequests
        .filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED')
        .reduce((sum, r) => sum + Number(r.amount), 0),
    );
    const paidRequests = payoutRequests.filter((r) => r.status === 'PAID');
    const legacyPaidSettlements = (settlements || []).filter(
      (s) => s.isPaid && !s.payoutRequestId,
    );
    const legacyPaidTotal = this.round2(
      legacyPaidSettlements.reduce((sum, s) => sum + Number(s.netPayout), 0),
    );
    const totalPaidOut = this.round2(
      paidRequests.reduce((sum, r) => sum + Number(r.amount), 0) + legacyPaidTotal,
    );

    const reservedOrPaid = this.round2(upcomingPayout + totalPaidOut);
    const rawAvailable = this.round2(totalClaimed - reservedOrPaid);
    const availableBalance = this.round2(Math.max(0, rawAvailable));
    const clawbackDeficit = rawAvailable < 0 ? this.round2(Math.abs(rawAvailable)) : 0;
    const withdrawableTotal = this.round2(Math.max(0, rawAvailable + readyToClaim));

    return {
      pendingEarnings,
      readyToClaim,
      totalClaimed,
      totalRefunded,
      upcomingPayout,
      totalPaidOut,
      reservedOrPaid,
      rawAvailable,
      availableBalance,
      clawbackDeficit,
      withdrawableTotal,
      paidPayoutsCount: paidRequests.length + legacyPaidSettlements.length,
    };
  }

  private getNextScheduledPayoutDate(frequency?: string): string {
    const freq = (frequency || 'Weekly').toLowerCase();
    const now = new Date();

    if (freq.includes('on-demand') || freq.includes('manual')) {
      return 'On-Demand (Request Anytime)';
    }

    if (freq.includes('monthly')) {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return next.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    if (freq.includes('bi-weekly') || freq.includes('biweekly')) {
      const day = now.getDate();
      const target =
        day < 15
          ? new Date(now.getFullYear(), now.getMonth(), 15)
          : new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return target.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    // Weekly (Every Friday)
    const dayOfWeek = now.getDay(); // 0=Sun..5=Fri
    let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    if (daysUntilFriday === 0) daysUntilFriday = 7;
    const nextFriday = new Date(now.getTime() + daysUntilFriday * DAY_MS);
    return nextFriday.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private buildChartData(earnings: any[], period: EarningsChartPeriod) {
    const now = new Date();
    const active = earnings.filter((e) => e.status !== 'REFUNDED');
    const refunded = earnings.filter((e) => e.status === 'REFUNDED');

    const filterByWindow = (list: any[], start: Date, end: Date) =>
      list.filter((e) => {
        const d = new Date(e.completedAt);
        return d >= start && d <= end;
      });

    let periodEarnings = active;
    let periodRefundedRows = refunded;
    const buckets: EarningsChartBucketDto[] = [];

    if (period === 'THIS_MONTH') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      periodEarnings = filterByWindow(active, monthStart, monthEnd);
      periodRefundedRows = filterByWindow(refunded, monthStart, monthEnd);

      for (let w = 0; w < 4; w++) {
        const startDay = w * 7 + 1;
        const endDay = w === 3 ? 31 : (w + 1) * 7;
        const inWeek = periodEarnings.filter((e) => {
          const day = new Date(e.completedAt).getDate();
          return day >= startDay && day <= endDay;
        });
        buckets.push({
          label: `Week ${w + 1}`,
          grossAmount: this.round2(inWeek.reduce((s, e) => s + Number(e.grossAmount), 0)),
          feeAmount: this.round2(inWeek.reduce((s, e) => s + Number(e.feeAmount), 0)),
          netAmount: this.round2(inWeek.reduce((s, e) => s + Number(e.netAmount), 0)),
          ordersCount: inWeek.length,
        });
      }
    } else if (period === 'LAST_30_DAYS') {
      const start = new Date(now.getTime() - 29 * DAY_MS);
      start.setHours(0, 0, 0, 0);
      periodEarnings = filterByWindow(active, start, now);
      periodRefundedRows = filterByWindow(refunded, start, now);

      for (let w = 0; w < 4; w++) {
        const bucketEnd = new Date(now.getTime() - (3 - w) * 7 * DAY_MS);
        const bucketStart = new Date(bucketEnd.getTime() - 7 * DAY_MS);
        const inBucket = periodEarnings.filter((e) => {
          const d = new Date(e.completedAt);
          return d > bucketStart && d <= bucketEnd;
        });
        buckets.push({
          label: `${bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          grossAmount: this.round2(inBucket.reduce((s, e) => s + Number(e.grossAmount), 0)),
          feeAmount: this.round2(inBucket.reduce((s, e) => s + Number(e.feeAmount), 0)),
          netAmount: this.round2(inBucket.reduce((s, e) => s + Number(e.netAmount), 0)),
          ordersCount: inBucket.length,
        });
      }
    } else if (period === 'LAST_6_MONTHS') {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      periodEarnings = filterByWindow(active, start, now);
      periodRefundedRows = filterByWindow(refunded, start, now);

      for (let m = 5; m >= 0; m--) {
        const target = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const inMonth = periodEarnings.filter((e) => {
          const d = new Date(e.completedAt);
          return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
        });
        buckets.push({
          label: target.toLocaleDateString('en-US', { month: 'short' }),
          grossAmount: this.round2(inMonth.reduce((s, e) => s + Number(e.grossAmount), 0)),
          feeAmount: this.round2(inMonth.reduce((s, e) => s + Number(e.feeAmount), 0)),
          netAmount: this.round2(inMonth.reduce((s, e) => s + Number(e.netAmount), 0)),
          ordersCount: inMonth.length,
        });
      }
    } else {
      // ALL_TIME: group by month over last 6 active months or current 6 months
      const monthKeys = new Map<string, { label: string; sortKey: number; rows: any[] }>();
      for (const e of periodEarnings) {
        const d = new Date(e.completedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthKeys.has(key)) {
          monthKeys.set(key, {
            label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            sortKey: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
            rows: [],
          });
        }
        monthKeys.get(key)!.rows.push(e);
      }

      const sorted = Array.from(monthKeys.values())
        .sort((a, b) => a.sortKey - b.sortKey)
        .slice(-6);

      if (sorted.length === 0) {
        for (let m = 5; m >= 0; m--) {
          const target = new Date(now.getFullYear(), now.getMonth() - m, 1);
          buckets.push({
            label: target.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            grossAmount: 0,
            feeAmount: 0,
            netAmount: 0,
            ordersCount: 0,
          });
        }
      } else {
        for (const entry of sorted) {
          buckets.push({
            label: entry.label,
            grossAmount: this.round2(entry.rows.reduce((s, e) => s + Number(e.grossAmount), 0)),
            feeAmount: this.round2(entry.rows.reduce((s, e) => s + Number(e.feeAmount), 0)),
            netAmount: this.round2(entry.rows.reduce((s, e) => s + Number(e.netAmount), 0)),
            ordersCount: entry.rows.length,
          });
        }
      }
    }

    const periodGross = this.round2(
      periodEarnings.reduce((s, e) => s + Number(e.grossAmount), 0),
    );
    const periodDeliveryFees = this.round2(
      periodEarnings.reduce((s, e) => s + Number(e.deliveryFee), 0),
    );
    const periodHandlingAndPackagingFees = this.round2(
      periodEarnings.reduce(
        (s, e) => s + Number(e.handlingFee) + Number(e.packagingFee),
        0,
      ),
    );
    const periodPlatformFees = this.round2(
      periodEarnings.reduce((s, e) => s + Number(e.feeAmount), 0),
    );
    const periodRefunded = this.round2(
      periodRefundedRows.reduce((s, e) => s + Number(e.netAmount), 0),
    );
    const periodNet = this.round2(
      periodEarnings.reduce((s, e) => s + Number(e.netAmount), 0),
    );

    return {
      period,
      buckets,
      periodGross,
      periodDeliveryFees,
      periodHandlingAndPackagingFees,
      periodPlatformFees,
      periodRefunded,
      periodNet,
    };
  }

  /**
   * Called automatically when an order transitions to DELIVERED or PARTIAL_DELIVERED.
   * Places net earnings into PENDING return-window hold (or READY_TO_CLAIM if window already elapsed).
   */
  async recordCompletedOrderEarning(orderIdOrExternal: string, txClient?: any) {
    const db = txClient || this.prisma;
    const order = await this.repository.findOrderWithDetails(orderIdOrExternal, db);
    if (!order) return null;

    if (order.status !== 'DELIVERED' && order.status !== 'PARTIAL_DELIVERED') {
      return null;
    }

    if (order.earning && order.earning.status === 'CLAIMED') {
      return order.earning;
    }

    const now = new Date();
    const completedAt = order.deliveredAt
      ? new Date(order.deliveredAt)
      : order.updatedAt
        ? new Date(order.updatedAt)
        : now;
    const returnWindowDays = Math.max(0, Number(order.merchant?.returnWindowDays ?? 3));
    const claimableAt = new Date(completedAt.getTime() + returnWindowDays * DAY_MS);
    const initialStatus: 'PENDING' | 'READY_TO_CLAIM' =
      now.getTime() >= claimableAt.getTime() ? 'READY_TO_CLAIM' : 'PENDING';

    const nums = this.computeOrderEarningNumbers(order, order.merchant);

    return this.repository.upsertOrderEarning(
      {
        transactionRef: nums.transactionRef,
        merchantId: order.merchantId,
        orderId: order.id,
        orderNumber: nums.orderNumber,
        itemSummary: nums.itemSummary,
        grossAmount: nums.grossAmount,
        deliveryFee: nums.deliveryFee,
        handlingFee: nums.handlingFee,
        packagingFee: nums.packagingFee,
        feeAmount: nums.feeAmount,
        netAmount: nums.netAmount,
        status: initialStatus,
        returnWindowDays,
        completedAt,
        claimableAt,
        refundedAt: null,
        refundReason: null,
      },
      db,
    );
  }

  /**
   * Called automatically when a customer returns or cancels an order.
   * Reverses the earning into REFUNDED status so returned goods are not paid out.
   */
  async reverseOrderEarning(
    orderIdOrExternal: string,
    reason?: string,
    txClient?: any,
  ) {
    const db = txClient || this.prisma;
    const order = await this.repository.findOrderWithDetails(orderIdOrExternal, db);
    if (!order || !order.earning) return null;
    if (order.earning.status === 'REFUNDED') return order.earning;

    const finalReason =
      (reason || '').trim() ||
      (order.status === 'CANCELLED'
        ? order.cancelReason || 'Order cancelled — earning reversed'
        : 'Customer returned product — earning refunded');

    return this.repository.markEarningRefunded(
      order.earning.id,
      order.returnedAt ? new Date(order.returnedAt) : new Date(),
      finalReason,
      db,
    );
  }

  /**
   * Idempotently reconciles completed orders, returned orders, and matured return windows.
   */
  async syncMerchantEarnings(merchantId?: string, txClient?: any) {
    const db = txClient || this.prisma;
    const now = new Date();

    const missingOrders = await this.repository.findCompletedOrdersWithoutEarning(
      merchantId,
      db,
    );
    for (const order of missingOrders) {
      const completedAt = order.deliveredAt
        ? new Date(order.deliveredAt)
        : order.updatedAt
          ? new Date(order.updatedAt)
          : now;
      const returnWindowDays = Math.max(0, Number(order.merchant?.returnWindowDays ?? 3));
      const claimableAt = new Date(completedAt.getTime() + returnWindowDays * DAY_MS);
      const status: 'PENDING' | 'READY_TO_CLAIM' =
        now.getTime() >= claimableAt.getTime() ? 'READY_TO_CLAIM' : 'PENDING';
      const nums = this.computeOrderEarningNumbers(order, order.merchant);

      await this.repository.upsertOrderEarning(
        {
          transactionRef: nums.transactionRef,
          merchantId: order.merchantId,
          orderId: order.id,
          orderNumber: nums.orderNumber,
          itemSummary: nums.itemSummary,
          grossAmount: nums.grossAmount,
          deliveryFee: nums.deliveryFee,
          handlingFee: nums.handlingFee,
          packagingFee: nums.packagingFee,
          feeAmount: nums.feeAmount,
          netAmount: nums.netAmount,
          status,
          returnWindowDays,
          completedAt,
          claimableAt,
        },
        db,
      );
    }

    const toRefund = await this.repository.findEarningsNeedingRefundSync(merchantId, db);
    for (const item of toRefund) {
      const ord = item.order;
      const reason =
        ord?.status === 'CANCELLED'
          ? ord.cancelReason || 'Order cancelled — earning reversed'
          : 'Customer returned product — earning refunded';
      const refundedAt = ord?.returnedAt || ord?.cancelledAt || ord?.updatedAt || now;
      await this.repository.markEarningRefunded(item.id, new Date(refundedAt), reason, db);
    }

    const reactivated = await this.repository.findRefundedEarningsReactivated(merchantId, db);
    for (const item of reactivated) {
      if (item.order) {
        await this.recordCompletedOrderEarning(item.order.id, db);
      }
    }

    await this.repository.promoteMaturePendingEarnings(now, merchantId, db);
  }

  /**
   * Returns complete dynamic Merchant Earnings & Payouts dashboard payload.
   */
  async getMerchantEarningsDashboard(
    merchantIdentifier?: string,
    period: EarningsChartPeriod = 'THIS_MONTH',
  ): Promise<MerchantEarningsDashboardDto> {
    const merchant = await this.repository.resolveMerchant(merchantIdentifier);
    if (!merchant) {
      throw new NotFoundException(`Merchant '${merchantIdentifier || 'default'}' not found.`);
    }

    await this.syncMerchantEarnings(merchant.id);

    const [earnings, payoutRequests, settlements] = await Promise.all([
      this.repository.findMerchantEarnings(merchant.id),
      this.repository.findMerchantPayoutRequests(merchant.id),
      typeof this.repository.getMerchantSettlements === 'function'
        ? this.repository.getMerchantSettlements(merchant.id)
        : Promise.resolve([]),
    ]);

    const balances = this.computeBalances(earnings, payoutRequests, settlements);
    const activeEarnings = earnings.filter((e) => e.status !== 'REFUNDED');

    const totalGrossEarnings = this.round2(
      activeEarnings.reduce((s, e) => s + Number(e.grossAmount), 0),
    );
    const totalDeliveryFees = this.round2(
      activeEarnings.reduce((s, e) => s + Number(e.deliveryFee), 0),
    );
    const totalHandlingFees = this.round2(
      activeEarnings.reduce((s, e) => s + Number(e.handlingFee), 0),
    );
    const totalPackagingFees = this.round2(
      activeEarnings.reduce((s, e) => s + Number(e.packagingFee), 0),
    );
    const totalPlatformFees = this.round2(
      activeEarnings.reduce((s, e) => s + Number(e.feeAmount), 0),
    );
    const totalNetEarnings = this.round2(
      activeEarnings.reduce((s, e) => s + Number(e.netAmount), 0),
    );

    const payoutAccount = (merchant.payoutAccount as Record<string, any>) || null;
    const nowMs = Date.now();

    return {
      merchant: {
        id: merchant.id,
        merchantCode: merchant.merchantCode,
        businessName: merchant.businessName,
        ownerName: merchant.ownerName || 'Store Owner',
        returnWindowDays: Number(merchant.returnWindowDays) || 3,
        minPayoutAmount: Number(merchant.minPayoutAmount) || 100,
        baseHandlingFee: Number(merchant.baseHandlingFee) || 50,
        payoutAccount,
      },
      summary: {
        availableBalance: balances.availableBalance,
        readyToClaim: balances.readyToClaim,
        withdrawableTotal: balances.withdrawableTotal,
        pendingEarnings: balances.pendingEarnings,
        totalClaimed: balances.totalClaimed,
        upcomingPayout: balances.upcomingPayout,
        totalPaidOut: balances.totalPaidOut,
        totalRefunded: balances.totalRefunded,
        clawbackDeficit: balances.clawbackDeficit,
        totalGrossEarnings,
        totalDeliveryFees,
        totalHandlingFees,
        totalPackagingFees,
        totalPlatformFees,
        totalNetEarnings,
        completedOrdersCount: activeEarnings.length,
        pendingCount: earnings.filter((e) => e.status === 'PENDING').length,
        readyToClaimCount: earnings.filter((e) => e.status === 'READY_TO_CLAIM').length,
        claimedCount: earnings.filter((e) => e.status === 'CLAIMED').length,
        refundedCount: earnings.filter((e) => e.status === 'REFUNDED').length,
        paidPayoutsCount: balances.paidPayoutsCount,
        nextScheduledPayoutDate: this.getNextScheduledPayoutDate(payoutAccount?.frequency),
      },
      chart: this.buildChartData(earnings, period),
      earnings: earnings.map((e) => this.mapEarningToDto(e, nowMs)),
      payoutRequests: payoutRequests.map((r) => this.mapPayoutRequestToDto(r)),
    };
  }

  /**
   * Moves READY_TO_CLAIM order earnings into CLAIMED (Wallet Available Balance).
   */
  async claimEarnings(
    merchantIdentifier: string | undefined,
    payload: { earningIds?: string[]; claimAll?: boolean },
  ) {
    const merchant = await this.repository.resolveMerchant(merchantIdentifier);
    if (!merchant) {
      throw new NotFoundException(`Merchant '${merchantIdentifier || 'default'}' not found.`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await this.repository.lockMerchantRow(tx, merchant.id);
      await this.syncMerchantEarnings(merchant.id, tx);

      const where: any = {
        merchantId: merchant.id,
        status: 'READY_TO_CLAIM',
      };
      if (!payload?.claimAll && Array.isArray(payload?.earningIds) && payload.earningIds.length > 0) {
        where.id = { in: payload.earningIds };
      }

      const targets = await tx.orderEarning.findMany({ where });
      if (targets.length === 0) {
        throw new BadRequestException(
          'No earnings are currently in the Ready to Claim stage.',
        );
      }

      const now = new Date();
      await tx.orderEarning.updateMany({
        where: { id: { in: targets.map((t: any) => t.id) } },
        data: { status: 'CLAIMED', claimedAt: now },
      });

      const claimedAmount = this.round2(
        targets.reduce((sum: number, t: any) => sum + Number(t.netAmount), 0),
      );

      await tx.activityLog.create({
        data: {
          action: 'EARNINGS_CLAIMED',
          entityType: 'Merchant',
          entityId: merchant.id,
          newValues: {
            claimedCount: targets.length,
            claimedAmount,
            earningIds: targets.map((t: any) => t.id),
          },
          notes: `Merchant ${merchant.merchantCode} claimed ${targets.length} order earning(s) totaling ৳${claimedAmount}`,
        },
      });

      return { claimedCount: targets.length, claimedAmount };
    });

    const dashboard = await this.getMerchantEarningsDashboard(merchant.id);
    return {
      ...result,
      summary: dashboard.summary,
    };
  }

  /**
   * Merchant submits a withdrawal / payout request from wallet or Claim stage.
   */
  async createPayoutRequest(
    merchantIdentifier: string | undefined,
    payload: {
      amount: number;
      method: string;
      provider: string;
      accountNumber: string;
      accountHolder?: string;
      branchName?: string;
      routingNumber?: string;
      remarks?: string;
    },
  ) {
    const merchant = await this.repository.resolveMerchant(merchantIdentifier);
    if (!merchant) {
      throw new NotFoundException(`Merchant '${merchantIdentifier || 'default'}' not found.`);
    }

    const amount = this.round2(Number(payload?.amount));
    const minPayout = Number(merchant.minPayoutAmount) || 100;
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Payout amount must be greater than zero.');
    }
    if (amount < minPayout) {
      throw new BadRequestException(`Minimum payout request amount is ৳${minPayout.toLocaleString()}.`);
    }

    const method = String(payload?.method || '').trim().toUpperCase();
    if (!VALID_PAYOUT_METHODS.has(method)) {
      throw new BadRequestException(`Unsupported payout method '${payload?.method}'.`);
    }

    const provider = String(payload?.provider || '').trim();
    const accountNumber = String(payload?.accountNumber || '').trim();
    if (!provider || !accountNumber) {
      throw new BadRequestException('Payout provider and account number are required.');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await this.repository.lockMerchantRow(tx, merchant.id);
      await this.syncMerchantEarnings(merchant.id, tx);

      const [earnings, payoutRequests, settlements] = await Promise.all([
        this.repository.findMerchantEarnings(merchant.id, tx),
        this.repository.findMerchantPayoutRequests(merchant.id, tx),
        typeof tx.settlement?.findMany === 'function'
          ? tx.settlement.findMany({ where: { merchantId: merchant.id } })
          : Promise.resolve([]),
      ]);

      const balances = this.computeBalances(earnings, payoutRequests, settlements);
      if (amount > balances.withdrawableTotal) {
        throw new BadRequestException(
          `Requested amount (৳${amount.toLocaleString()}) exceeds your withdrawable balance (৳${balances.withdrawableTotal.toLocaleString()} — Wallet: ৳${balances.availableBalance.toLocaleString()} + Ready to Claim: ৳${balances.readyToClaim.toLocaleString()}).`,
        );
      }

      // If requested amount draws from the Claim stage, atomically promote enough READY_TO_CLAIM earnings to CLAIMED
      const autoClaimedIds: string[] = [];
      if (amount > balances.availableBalance) {
        let shortfall = this.round2(amount - balances.rawAvailable);
        const readyRows = earnings
          .filter((e: any) => e.status === 'READY_TO_CLAIM')
          .sort(
            (a: any, b: any) =>
              new Date(a.claimableAt).getTime() - new Date(b.claimableAt).getTime(),
          );

        for (const row of readyRows) {
          if (shortfall <= 0) break;
          autoClaimedIds.push(row.id);
          shortfall = this.round2(shortfall - Number(row.netAmount));
        }

        if (autoClaimedIds.length > 0) {
          await tx.orderEarning.updateMany({
            where: { id: { in: autoClaimedIds } },
            data: { status: 'CLAIMED', claimedAt: new Date() },
          });
        }
      }

      const requestCode = `PR-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 89)}`;
      const reqRecord = await tx.payoutRequest.create({
        data: {
          requestCode,
          merchantId: merchant.id,
          amount,
          method: method as any,
          provider,
          accountNumber,
          accountHolder: payload.accountHolder?.trim() || merchant.ownerName || merchant.businessName,
          branchName: payload.branchName?.trim() || undefined,
          routingNumber: payload.routingNumber?.trim() || undefined,
          remarks: payload.remarks?.trim() || undefined,
          status: 'PENDING',
        },
        include: {
          merchant: {
            select: {
              id: true,
              merchantCode: true,
              businessName: true,
              ownerName: true,
            },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          action: 'PAYOUT_REQUESTED',
          entityType: 'PayoutRequest',
          entityId: reqRecord.id,
          newValues: {
            requestCode,
            merchantId: merchant.id,
            amount,
            method,
            provider,
            accountNumber,
            autoClaimedIds,
          },
          notes: `Merchant ${merchant.merchantCode} requested payout of ৳${amount} via ${provider}`,
        },
      });

      await tx.inAppNotification.create({
        data: {
          recipientRole: UserRole.SUPER_ADMIN,
          merchantId: merchant.id,
          title: 'New Merchant Payout Request',
          message: `${merchant.businessName} (${merchant.merchantCode}) requested ৳${amount.toLocaleString()} via ${provider}.`,
          type: 'PAYOUT_REQUESTED',
          linkUrl: '/admin/payouts',
        },
      });

      return reqRecord;
    });

    return this.mapPayoutRequestToDto(created);
  }

  /**
   * Merchant cancels their own PENDING payout request, freeing the reserved wallet balance.
   */
  async cancelPayoutRequest(idOrCode: string, merchantIdentifier?: string) {
    const merchant = await this.repository.resolveMerchant(merchantIdentifier);
    if (!merchant) {
      throw new NotFoundException(`Merchant '${merchantIdentifier || 'default'}' not found.`);
    }

    const existing = await this.repository.findPayoutRequestByIdOrCode(idOrCode);
    if (!existing) {
      throw new NotFoundException(`Payout request '${idOrCode}' not found.`);
    }
    if (existing.merchantId !== merchant.id) {
      throw new ForbiddenException('You can only cancel your own payout requests.');
    }
    if (existing.status !== 'PENDING') {
      throw new BadRequestException(
        `Only PENDING payout requests can be cancelled (current status: ${existing.status}).`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.payoutRequest.update({
        where: { id: existing.id },
        data: { status: 'CANCELLED' },
        include: {
          merchant: {
            select: { id: true, merchantCode: true, businessName: true, ownerName: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          action: 'PAYOUT_CANCELLED',
          entityType: 'PayoutRequest',
          entityId: row.id,
          previousValues: { status: existing.status },
          newValues: { status: 'CANCELLED' },
          notes: `Merchant cancelled payout request ${existing.requestCode}`,
        },
      });

      return row;
    });

    return this.mapPayoutRequestToDto(updated);
  }

  async listPayoutRequests(filters?: {
    merchantId?: string;
    merchantCode?: string;
    status?: string;
    method?: string;
    search?: string;
  }) {
    let resolvedMerchantId: string | undefined;
    const rawIdentifier = filters?.merchantId || filters?.merchantCode;
    if (rawIdentifier && rawIdentifier !== 'ALL') {
      const m = await this.repository.resolveMerchant(rawIdentifier);
      if (m) resolvedMerchantId = m.id;
    }

    const [filtered, all] = await Promise.all([
      this.repository.findAllPayoutRequests({
        merchantId: resolvedMerchantId,
        status: filters?.status,
        method: filters?.method,
        search: filters?.search,
      }),
      this.repository.findAllPayoutRequests(
        resolvedMerchantId ? { merchantId: resolvedMerchantId } : undefined,
      ),
    ]);

    const items = filtered.map((r) => this.mapPayoutRequestToDto(r));
    const stats = {
      totalRequests: all.length,
      pendingRequests: all.filter((r) => r.status === 'PENDING').length,
      acceptedRequests: all.filter((r) => r.status === 'ACCEPTED').length,
      paidRequests: all.filter((r) => r.status === 'PAID').length,
      rejectedRequests: all.filter((r) => r.status === 'REJECTED').length,
      cancelledRequests: all.filter((r) => r.status === 'CANCELLED').length,
      totalPendingAmount: this.round2(
        all
          .filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED')
          .reduce((s, r) => s + Number(r.amount), 0),
      ),
      totalPaidAmount: this.round2(
        all.filter((r) => r.status === 'PAID').reduce((s, r) => s + Number(r.amount), 0),
      ),
    };

    return { items, stats };
  }

  async acceptPayoutRequest(idOrCode: string, adminId?: string) {
    const existing = await this.repository.findPayoutRequestByIdOrCode(idOrCode);
    if (!existing) {
      throw new NotFoundException(`Payout request '${idOrCode}' not found.`);
    }
    if (existing.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot accept payout request ${existing.requestCode} from status '${existing.status}'.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.payoutRequest.update({
        where: { id: existing.id },
        data: {
          status: 'ACCEPTED',
          reviewedAt: new Date(),
          reviewedByAdminId: adminId,
          rejectionReason: null,
        },
        include: {
          merchant: {
            select: { id: true, merchantCode: true, businessName: true, ownerName: true },
          },
        },
      });

      await tx.inAppNotification.create({
        data: {
          recipientRole: UserRole.MERCHANT,
          merchantId: existing.merchantId,
          title: 'Payout Request Approved',
          message: `Your payout request ${existing.requestCode} for ৳${Number(existing.amount).toLocaleString()} has been approved and queued for transfer.`,
          type: 'PAYOUT_ACCEPTED',
          linkUrl: '/merchant/billing',
        },
      });

      await tx.activityLog.create({
        data: {
          userId: adminId,
          action: 'PAYOUT_ACCEPTED',
          entityType: 'PayoutRequest',
          entityId: row.id,
          previousValues: { status: existing.status },
          newValues: { status: 'ACCEPTED' },
          notes: `Admin accepted payout request ${existing.requestCode}`,
        },
      });

      return row;
    });

    return this.mapPayoutRequestToDto(updated);
  }

  async rejectPayoutRequest(idOrCode: string, rejectionReason?: string, adminId?: string) {
    const existing = await this.repository.findPayoutRequestByIdOrCode(idOrCode);
    if (!existing) {
      throw new NotFoundException(`Payout request '${idOrCode}' not found.`);
    }
    if (existing.status !== 'PENDING' && existing.status !== 'ACCEPTED') {
      throw new BadRequestException(
        `Cannot reject payout request ${existing.requestCode} from status '${existing.status}'.`,
      );
    }

    const reason = (rejectionReason || '').trim() || 'Rejected by Finance Admin';

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.payoutRequest.update({
        where: { id: existing.id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          reviewedAt: new Date(),
          reviewedByAdminId: adminId,
        },
        include: {
          merchant: {
            select: { id: true, merchantCode: true, businessName: true, ownerName: true },
          },
        },
      });

      await tx.inAppNotification.create({
        data: {
          recipientRole: UserRole.MERCHANT,
          merchantId: existing.merchantId,
          title: 'Payout Request Rejected',
          message: `Payout request ${existing.requestCode} (৳${Number(existing.amount).toLocaleString()}) was rejected: ${reason}. Balance has been restored to your wallet.`,
          type: 'PAYOUT_REJECTED',
          linkUrl: '/merchant/billing',
        },
      });

      await tx.activityLog.create({
        data: {
          userId: adminId,
          action: 'PAYOUT_REJECTED',
          entityType: 'PayoutRequest',
          entityId: row.id,
          previousValues: { status: existing.status },
          newValues: { status: 'REJECTED', rejectionReason: reason },
          notes: `Admin rejected payout request ${existing.requestCode}: ${reason}`,
        },
      });

      return row;
    });

    return this.mapPayoutRequestToDto(updated);
  }

  async bulkUpdatePayoutRequests(
    ids: string[],
    action: 'ACCEPT' | 'REJECT',
    rejectionReason?: string,
    adminId?: string,
  ) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Select at least one payout request.');
    }

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    for (const id of ids) {
      try {
        if (action === 'ACCEPT') {
          await this.acceptPayoutRequest(id, adminId);
        } else {
          await this.rejectPayoutRequest(id, rejectionReason, adminId);
        }
        results.push({ id, ok: true });
      } catch (err: any) {
        results.push({ id, ok: false, error: err?.message || 'Failed' });
      }
    }

    return {
      updatedCount: results.filter((r) => r.ok).length,
      failedCount: results.filter((r) => !r.ok).length,
      results,
    };
  }

  /**
   * Admin settles payout request with MANDATORY Transaction ID + Digital Proof document/screenshot.
   */
  async completePayoutRequest(
    idOrCode: string,
    payload: {
      trxId: string;
      proofDocumentUrl: string;
      proofDocumentName?: string;
      proofDocumentMime?: string;
      proofChannel?: string;
      proofNotes?: string;
      paidByAdminId?: string;
      paidByAdminName?: string;
    },
  ) {
    const existing = await this.repository.findPayoutRequestByIdOrCode(idOrCode);
    if (!existing) {
      throw new NotFoundException(`Payout request '${idOrCode}' not found.`);
    }
    if (existing.status !== 'ACCEPTED' && existing.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot mark payout request ${existing.requestCode} as PAID from status '${existing.status}'.`,
      );
    }

    const trxId = String(payload?.trxId || '').trim();
    const proofDocumentUrl = String(payload?.proofDocumentUrl || '').trim();
    if (!trxId) {
      throw new BadRequestException('Transaction ID (TrxID) is required to settle a payout.');
    }
    if (!proofDocumentUrl) {
      throw new BadRequestException(
        'Digital proof document or payment receipt screenshot is strictly required for every payout.',
      );
    }
    if (
      !proofDocumentUrl.startsWith('data:image/') &&
      !proofDocumentUrl.startsWith('data:application/pdf') &&
      !proofDocumentUrl.startsWith('https://') &&
      !proofDocumentUrl.startsWith('http://') &&
      !proofDocumentUrl.startsWith('/uploads/')
    ) {
      throw new BadRequestException('Digital proof must be an uploaded image/PDF or valid URL.');
    }

    const paidAt = new Date();
    const amountNum = Number(existing.amount);
    const proofChecksum = createHash('sha256')
      .update(
        `${existing.requestCode}|${existing.merchantId}|${amountNum.toFixed(2)}|${trxId}|${paidAt.toISOString()}|${proofDocumentUrl.slice(0, 256)}`,
      )
      .digest('hex');

    const adminName = payload.paidByAdminName?.trim() || 'Super Admin';
    const proofChannel = payload.proofChannel?.trim() || existing.provider;

    const { payoutRequest, settlement } = await this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.payoutRequest.update({
        where: { id: existing.id },
        data: {
          status: 'PAID',
          trxId,
          proofDocumentUrl,
          proofDocumentName: payload.proofDocumentName?.trim() || `proof-${trxId}`,
          proofDocumentMime: payload.proofDocumentMime?.trim() || 'image/jpeg',
          proofChannel,
          proofNotes: payload.proofNotes?.trim() || undefined,
          proofChecksum,
          paidAt,
          paidByAdminId: payload.paidByAdminId,
          paidByAdminName: adminName,
          reviewedAt: existing.reviewedAt || paidAt,
        },
        include: {
          merchant: {
            select: { id: true, merchantCode: true, businessName: true, ownerName: true },
          },
        },
      });

      const settlementRecord = await this.repository.createSettlement(
        {
          merchantId: existing.merchantId,
          payoutRequestId: existing.id,
          transactionRef: trxId,
          paymentMethod: existing.method,
          accountDetails: {
            provider: existing.provider,
            accountNumber: existing.accountNumber,
            accountHolder: existing.accountHolder || existing.merchant?.ownerName,
            branchName: existing.branchName,
            routingNumber: existing.routingNumber,
          },
          proofDocumentUrl,
          proofDocumentName: payload.proofDocumentName?.trim() || `proof-${trxId}`,
          proofDocumentMime: payload.proofDocumentMime?.trim() || 'image/jpeg',
          proofChecksum,
          remarks:
            payload.proofNotes?.trim() ||
            `Disbursed against Payout Request ${existing.requestCode}`,
          cycleStart: existing.requestedAt,
          cycleEnd: paidAt,
          totalCodCollected: amountNum,
          storageFees: 0,
          handlingFees: 0,
          packagingFees: 0,
          netPayout: amountNum,
          isPaid: true,
          paidAt,
        },
        tx,
      );

      await tx.inAppNotification.create({
        data: {
          recipientRole: UserRole.MERCHANT,
          merchantId: existing.merchantId,
          title: 'Payout Disbursed with Digital Proof',
          message: `৳${amountNum.toLocaleString()} has been disbursed for ${existing.requestCode} (TrxID: ${trxId}). Digital proof voucher is now available.`,
          type: 'PAYOUT_PAID',
          linkUrl: '/merchant/billing',
        },
      });

      await tx.activityLog.create({
        data: {
          userId: payload.paidByAdminId,
          action: 'PAYOUT_PAID',
          entityType: 'PayoutRequest',
          entityId: updatedRequest.id,
          previousValues: { status: existing.status },
          newValues: {
            status: 'PAID',
            trxId,
            proofChecksum,
            settlementId: settlementRecord.id,
          },
          notes: `Admin settled payout ${existing.requestCode} (৳${amountNum}) with TrxID ${trxId} and digital proof`,
        },
      });

      return { payoutRequest: updatedRequest, settlement: settlementRecord };
    });

    return {
      payoutRequest: this.mapPayoutRequestToDto(payoutRequest),
      settlement,
    };
  }

  /**
   * Admin: List all order earnings across merchants (with return-window hold inspection).
   */
  async listAdminOrderEarnings(filters?: {
    merchantId?: string;
    merchantCode?: string;
    status?: string;
    search?: string;
  }) {
    let resolvedMerchantId: string | undefined;
    const rawIdentifier = filters?.merchantId || filters?.merchantCode;
    if (rawIdentifier && rawIdentifier !== 'ALL') {
      const m = await this.repository.resolveMerchant(rawIdentifier);
      if (m) resolvedMerchantId = m.id;
    }

    await this.syncMerchantEarnings(resolvedMerchantId);

    const rows = await this.repository.findAdminOrderEarnings({
      merchantId: resolvedMerchantId,
      status: filters?.status,
      search: filters?.search,
    });

    const nowMs = Date.now();
    return rows.map((e: any) => this.mapEarningToDto(e, nowMs));
  }

  /**
   * Admin: Early release of a PENDING order earning to READY_TO_CLAIM when return risk is cleared.
   */
  async releaseOrderEarningEarly(earningId: string, adminId?: string) {
    const existing = await this.repository.findEarningById(earningId);
    if (!existing) {
      throw new NotFoundException(`Order earning '${earningId}' not found.`);
    }
    if (existing.status !== 'PENDING') {
      throw new BadRequestException(
        `Only PENDING earnings can be released early (current status: ${existing.status}).`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.orderEarning.update({
        where: { id: existing.id },
        data: {
          status: 'READY_TO_CLAIM',
          claimableAt: now,
          releasedByAdmin: true,
        },
        include: {
          merchant: { select: { id: true, merchantCode: true, businessName: true } },
          order: { select: { customerName: true, status: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: adminId,
          action: 'EARNING_EARLY_RELEASED',
          entityType: 'OrderEarning',
          entityId: row.id,
          previousValues: { status: 'PENDING', claimableAt: existing.claimableAt },
          newValues: { status: 'READY_TO_CLAIM', claimableAt: now, releasedByAdmin: true },
          notes: `Admin released order ${existing.orderNumber} earning early to Ready to Claim`,
        },
      });

      await tx.inAppNotification.create({
        data: {
          recipientRole: UserRole.MERCHANT,
          merchantId: existing.merchantId,
          title: 'Order Earning Ready to Claim',
          message: `Order ${existing.orderNumber} (৳${Number(existing.netAmount).toLocaleString()}) has been released to Ready to Claim.`,
          type: 'EARNING_RELEASED',
          linkUrl: '/merchant/billing',
        },
      });

      return row;
    });

    return this.mapEarningToDto(updated);
  }

  async updateMerchantBillingSettings(
    merchantIdentifier: string,
    payload: { returnWindowDays?: number; minPayoutAmount?: number },
  ) {
    const merchant = await this.repository.resolveMerchant(merchantIdentifier);
    if (!merchant) {
      throw new NotFoundException(`Merchant '${merchantIdentifier}' not found.`);
    }

    const data: any = {};
    if (payload.returnWindowDays !== undefined) {
      const days = Math.round(Number(payload.returnWindowDays));
      if (!Number.isFinite(days) || days < 0 || days > 60) {
        throw new BadRequestException('Return window days must be between 0 and 60.');
      }
      data.returnWindowDays = days;
    }
    if (payload.minPayoutAmount !== undefined) {
      const min = this.round2(Number(payload.minPayoutAmount));
      if (!Number.isFinite(min) || min < 1) {
        throw new BadRequestException('Minimum payout amount must be at least ৳1.');
      }
      data.minPayoutAmount = min;
    }

    const updated = await this.prisma.merchant.update({
      where: { id: merchant.id },
      data,
    });

    return {
      id: updated.id,
      merchantCode: updated.merchantCode,
      businessName: updated.businessName,
      returnWindowDays: updated.returnWindowDays,
      minPayoutAmount: Number(updated.minPayoutAmount),
    };
  }

  async calculateMerchantSettlement(merchantId: string, grossCod?: number, ordersCount?: number) {
    const merchant = await this.repository.resolveMerchant(merchantId);
    if (!merchant) {
      throw new NotFoundException(`Merchant '${merchantId}' not found.`);
    }

    const baseHandlingRate = Number(merchant.baseHandlingFee) || 50;
    const monthlyStorage = Number(merchant.monthlyStorageFee) || 2500;

    let totalGrossCod = grossCod;
    let count = ordersCount;

    const lastSettlement =
      typeof this.prisma.settlement?.findFirst === 'function'
        ? await this.prisma.settlement.findFirst({
            where: { merchantId: merchant.id, payoutRequestId: null },
            orderBy: { cycleEnd: 'desc' },
          })
        : null;

    if (totalGrossCod === undefined || count === undefined) {
      const delivered = await this.prisma.order.findMany({
        where: {
          merchantId: merchant.id,
          status: 'DELIVERED',
          ...(lastSettlement?.cycleEnd
            ? { deliveredAt: { gt: lastSettlement.cycleEnd } }
            : {}),
        },
        select: { codAmount: true, totalAmount: true },
      });
      totalGrossCod = delivered.reduce(
        (sum, o) => sum + Number(o.codAmount ?? o.totalAmount),
        0,
      );
      count = delivered.length;
    }

    const totalHandlingFees = count * baseHandlingRate;
    const weeklyStorageFees = count > 0 ? Math.round(monthlyStorage / 4) : 0;
    const netPayout = Math.max(0, totalGrossCod - totalHandlingFees - weeklyStorageFees);

    const cycleEnd = new Date();
    const cycleStart = lastSettlement?.cycleEnd
      ? new Date(lastSettlement.cycleEnd)
      : new Date(Date.now() - 7 * DAY_MS);

    return this.repository.createSettlement({
      merchantId: merchant.id,
      cycleStart,
      cycleEnd,
      totalCodCollected: totalGrossCod,
      storageFees: weeklyStorageFees,
      handlingFees: totalHandlingFees,
      netPayout,
    });
  }

  async recordDisbursement(data: {
    merchantId: string;
    amount: number;
    paymentMethod?: string;
    paidAt?: Date;
    notes?: string;
    trxId?: string;
    proofDocumentUrl?: string;
    proofDocumentName?: string;
    proofDocumentMime?: string;
  }) {
    const merchant = await this.repository.resolveMerchant(data.merchantId);
    if (!merchant) {
      throw new NotFoundException(`Merchant '${data.merchantId}' not found.`);
    }

    const txDate = data.paidAt || new Date();
    const trxId = (data.trxId || '').trim() || `DISB-${Date.now()}`;
    const proofChecksum = data.proofDocumentUrl
      ? createHash('sha256')
          .update(`${merchant.id}|${Number(data.amount).toFixed(2)}|${trxId}|${txDate.toISOString()}`)
          .digest('hex')
      : undefined;

    return this.repository.createSettlement({
      merchantId: merchant.id,
      transactionRef: trxId,
      paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
      proofDocumentUrl: data.proofDocumentUrl,
      proofDocumentName: data.proofDocumentName,
      proofDocumentMime: data.proofDocumentMime,
      proofChecksum,
      remarks: data.notes,
      cycleStart: txDate,
      cycleEnd: txDate,
      totalCodCollected: data.amount,
      storageFees: 0,
      handlingFees: 0,
      packagingFees: 0,
      netPayout: data.amount,
      isPaid: true,
      paidAt: txDate,
    });
  }

  async getSettlementHistory(merchantIdentifier?: string) {
    let resolvedId: string | undefined;
    if (merchantIdentifier && merchantIdentifier !== 'ALL') {
      const m = await this.repository.resolveMerchant(merchantIdentifier);
      resolvedId = m?.id;
    }

    await this.syncMerchantEarnings(resolvedId);
    const settlements = await this.repository.getMerchantSettlements(resolvedId);

    return settlements.map((s: any) => {
      const pr = s.payoutRequest;
      const acc =
        (s.accountDetails as Record<string, any>) ||
        (s.merchant?.payoutAccount as Record<string, any>) ||
        {};
      const method = s.paymentMethod || pr?.method || acc.method || 'BANK_TRANSFER';
      return {
        id: s.id,
        payoutRequestId: s.payoutRequestId || pr?.id || undefined,
        requestCode: pr?.requestCode || undefined,
        transactionRef: s.transactionRef || pr?.trxId || `SET-${s.id.slice(0, 8).toUpperCase()}`,
        merchantId: s.merchantId,
        merchantCode: s.merchant?.merchantCode || '',
        merchantName: s.merchant?.businessName || 'Merchant',
        ownerName: s.merchant?.ownerName || 'Store Owner',
        paymentMethod: method,
        accountDetails: {
          provider: acc.provider || pr?.provider || 'Bank / MFS',
          accountNumber: acc.accountNumber || pr?.accountNumber || acc.bkashMerchantNumber || '',
          accountHolder:
            acc.accountHolder || pr?.accountHolder || s.merchant?.ownerName || 'Store Owner',
        },
        totalCodCollected: Number(s.totalCodCollected),
        storageFees: Number(s.storageFees),
        handlingFees: Number(s.handlingFees),
        packagingFees: Number(s.packagingFees),
        netPayout: Number(s.netPayout),
        isPaid: Boolean(s.isPaid),
        paidAt: s.paidAt ? new Date(s.paidAt).toISOString() : pr?.paidAt ? new Date(pr.paidAt).toISOString() : undefined,
        createdAt: new Date(s.createdAt).toISOString(),
        proofDocumentUrl: s.proofDocumentUrl || pr?.proofDocumentUrl || undefined,
        proofDocumentName: s.proofDocumentName || pr?.proofDocumentName || undefined,
        proofDocumentMime: s.proofDocumentMime || pr?.proofDocumentMime || undefined,
        proofChannel: pr?.proofChannel || undefined,
        proofNotes: pr?.proofNotes || s.remarks || undefined,
        proofChecksum: s.proofChecksum || pr?.proofChecksum || undefined,
        paidByAdminName: pr?.paidByAdminName || 'Super Admin',
        remarks: s.remarks || pr?.proofNotes || undefined,
      };
    });
  }

  async markSettlementPaid(settlementId: string) {
    return this.repository.markSettlementAsPaid(settlementId);
  }

  async getBillingOverview(merchantIdentifier?: string) {
    let resolvedId: string | undefined;
    if (merchantIdentifier && merchantIdentifier !== 'ALL') {
      const m = await this.repository.resolveMerchant(merchantIdentifier);
      resolvedId = m?.id;
    }

    await this.syncMerchantEarnings(resolvedId);
    return this.repository.getBillingAggregates(resolvedId);
  }

  private mapFinanceEntryToDto(entry: any): CompanyFinanceEntryDto {
    return {
      id: entry.id,
      entryCode: entry.entryCode,
      type: entry.type as FinanceEntryType,
      category: entry.category as FinanceEntryCategory,
      title: entry.title,
      amount: this.round2(Number(entry.amount)),
      entryDate: new Date(entry.entryDate).toISOString(),
      merchantId: entry.merchantId || null,
      merchantCode: entry.merchant?.merchantCode || null,
      merchantName: entry.merchant?.businessName || null,
      paymentMethod: entry.paymentMethod || null,
      referenceNo: entry.referenceNo || null,
      notes: entry.notes || null,
      createdByAdminId: entry.createdByAdminId || null,
      createdByAdminName: entry.createdByAdminName || null,
      createdAt: new Date(entry.createdAt).toISOString(),
      updatedAt: new Date(entry.updatedAt).toISOString(),
    };
  }

  private resolveFinanceDateWindow(
    presetRaw?: string,
    startDateStr?: string,
    endDateStr?: string,
  ): {
    preset: FinanceTimeframePreset;
    start: Date;
    end: Date;
    isAllTime: boolean;
    label: string;
  } {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const normalized = String(presetRaw || 'THIS_MONTH').toUpperCase();

    if (normalized === 'TODAY') {
      return {
        preset: 'TODAY',
        start: todayStart,
        end: todayEnd,
        isAllTime: false,
        label: 'Today',
      };
    }

    if (normalized === 'LAST_7_DAYS') {
      const start = new Date(todayStart.getTime() - 6 * DAY_MS);
      return {
        preset: 'LAST_7_DAYS',
        start,
        end: todayEnd,
        isAllTime: false,
        label: 'Last 7 Days',
      };
    }

    if (normalized === 'LAST_30_DAYS') {
      const start = new Date(todayStart.getTime() - 29 * DAY_MS);
      return {
        preset: 'LAST_30_DAYS',
        start,
        end: todayEnd,
        isAllTime: false,
        label: 'Last 30 Days',
      };
    }

    if (normalized === 'ALL_TIME') {
      const fallbackStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      return {
        preset: 'ALL_TIME',
        start: fallbackStart,
        end: todayEnd,
        isAllTime: true,
        label: 'All Time',
      };
    }

    if (normalized === 'CUSTOM' && startDateStr && endDateStr) {
      const parsedStart = new Date(startDateStr);
      const parsedEnd = new Date(endDateStr);
      if (!Number.isNaN(parsedStart.getTime()) && !Number.isNaN(parsedEnd.getTime())) {
        const s = new Date(
          parsedStart.getFullYear(),
          parsedStart.getMonth(),
          parsedStart.getDate(),
          0,
          0,
          0,
          0,
        );
        const e = new Date(
          parsedEnd.getFullYear(),
          parsedEnd.getMonth(),
          parsedEnd.getDate(),
          23,
          59,
          59,
          999,
        );
        const [start, end] = s.getTime() <= e.getTime() ? [s, e] : [e, s];
        const fmt = (d: Date) =>
          d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return {
          preset: 'CUSTOM',
          start,
          end,
          isAllTime: false,
          label: `${fmt(start)} – ${fmt(end)}`,
        };
      }
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      preset: 'THIS_MONTH',
      start: monthStart,
      end: monthEnd,
      isAllTime: false,
      label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }

  private validateAndNormalizeFinancePayload(payload: {
    type?: string;
    category?: string;
    title?: string;
    amount?: number;
    entryDate?: string;
    paymentMethod?: string;
    referenceNo?: string;
    notes?: string;
  }) {
    const type = String(payload?.type || '').trim().toUpperCase();
    if (!VALID_FINANCE_TYPES.has(type)) {
      throw new BadRequestException("Entry type must be 'EXPENSE' or 'INCOME'.");
    }

    const category = String(payload?.category || '').trim().toUpperCase();
    if (type === FinanceEntryType.EXPENSE && !VALID_EXPENSE_CATEGORIES.has(category)) {
      throw new BadRequestException(
        `Invalid expense category '${category}'. Allowed: RENT, SALARY, COURIER_COST, PACKAGING_PURCHASE, UTILITY_MISC.`,
      );
    }
    if (type === FinanceEntryType.INCOME && !VALID_INCOME_CATEGORIES.has(category)) {
      throw new BadRequestException(
        `Invalid income category '${category}'. Allowed: STORAGE_FEE, OTHER_INCOME.`,
      );
    }

    const title = String(payload?.title || '').trim();
    if (!title || title.length < 2) {
      throw new BadRequestException('Title / description is required (minimum 2 characters).');
    }

    const amount = this.round2(Number(payload?.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    const entryDate = payload?.entryDate ? new Date(payload.entryDate) : new Date();
    if (Number.isNaN(entryDate.getTime())) {
      throw new BadRequestException('Invalid entryDate provided.');
    }

    return {
      type: type as FinanceEntryType,
      category: category as FinanceEntryCategory,
      title,
      amount,
      entryDate,
      paymentMethod: payload?.paymentMethod?.trim() || null,
      referenceNo: payload?.referenceNo?.trim() || null,
      notes: payload?.notes?.trim() || null,
    };
  }

  async createCompanyFinanceEntry(
    payload: {
      type: string;
      category: string;
      title: string;
      amount: number;
      entryDate?: string;
      merchantId?: string;
      paymentMethod?: string;
      referenceNo?: string;
      notes?: string;
    },
    adminCtx?: { adminId?: string; adminName?: string },
  ): Promise<CompanyFinanceEntryDto> {
    const normalized = this.validateAndNormalizeFinancePayload(payload);

    let resolvedMerchantId: string | null = null;
    if (payload?.merchantId && payload.merchantId !== 'ALL') {
      const merchant = await this.repository.resolveMerchant(payload.merchantId);
      if (!merchant) {
        throw new NotFoundException(`Merchant '${payload.merchantId}' not found.`);
      }
      resolvedMerchantId = merchant.id;
    }

    const entryCode = `FIN-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 89)}`;
    const created = await this.repository.createFinanceEntry({
      entryCode,
      ...normalized,
      merchantId: resolvedMerchantId,
      createdByAdminId: adminCtx?.adminId || null,
      createdByAdminName: adminCtx?.adminName || 'Super Admin',
    });

    return this.mapFinanceEntryToDto(created);
  }

  async updateCompanyFinanceEntry(
    id: string,
    payload: {
      type?: string;
      category?: string;
      title?: string;
      amount?: number;
      entryDate?: string;
      merchantId?: string | null;
      paymentMethod?: string | null;
      referenceNo?: string | null;
      notes?: string | null;
    },
  ): Promise<CompanyFinanceEntryDto> {
    const existing = await this.repository.findFinanceEntryById(id);
    if (!existing) {
      throw new NotFoundException(`Finance entry '${id}' not found.`);
    }

    const normalized = this.validateAndNormalizeFinancePayload({
      type: payload?.type ?? existing.type,
      category: payload?.category ?? existing.category,
      title: payload?.title ?? existing.title,
      amount: payload?.amount ?? Number(existing.amount),
      entryDate: payload?.entryDate ?? new Date(existing.entryDate).toISOString(),
      paymentMethod:
        payload?.paymentMethod !== undefined
          ? payload.paymentMethod ?? undefined
          : existing.paymentMethod ?? undefined,
      referenceNo:
        payload?.referenceNo !== undefined
          ? payload.referenceNo ?? undefined
          : existing.referenceNo ?? undefined,
      notes:
        payload?.notes !== undefined ? payload.notes ?? undefined : existing.notes ?? undefined,
    });

    let resolvedMerchantId: string | null = existing.merchantId || null;
    if (payload?.merchantId !== undefined) {
      if (!payload.merchantId || payload.merchantId === 'ALL') {
        resolvedMerchantId = null;
      } else {
        const merchant = await this.repository.resolveMerchant(payload.merchantId);
        if (!merchant) {
          throw new NotFoundException(`Merchant '${payload.merchantId}' not found.`);
        }
        resolvedMerchantId = merchant.id;
      }
    }

    const updated = await this.repository.updateFinanceEntry(existing.id, {
      ...normalized,
      merchantId: resolvedMerchantId,
    });

    return this.mapFinanceEntryToDto(updated);
  }

  async deleteCompanyFinanceEntry(id: string) {
    const existing = await this.repository.findFinanceEntryById(id);
    if (!existing) {
      throw new NotFoundException(`Finance entry '${id}' not found.`);
    }
    await this.repository.deleteFinanceEntry(existing.id);
    return { deleted: true, id: existing.id };
  }

  private buildFinanceTimeSeriesBuckets(
    window: {
      preset: FinanceTimeframePreset;
      start: Date;
      end: Date;
      isAllTime: boolean;
    },
    periodOrders: any[],
    periodActiveEarnings: any[],
    periodLedgerEntries: any[],
  ): FinanceTimeSeriesBucketDto[] {
    const toLocalDateKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const buckets: FinanceTimeSeriesBucketDto[] = [];

    if (window.preset === 'TODAY') {
      for (let slot = 0; slot < 8; slot++) {
        const startHour = slot * 3;
        const endHour = startHour + 3;
        const slotStart = new Date(
          window.start.getFullYear(),
          window.start.getMonth(),
          window.start.getDate(),
          startHour,
          0,
          0,
          0,
        );
        const slotEnd = new Date(
          window.start.getFullYear(),
          window.start.getMonth(),
          window.start.getDate(),
          endHour - 1,
          59,
          59,
          999,
        );

        const inSlot = (dt: any) => {
          const t = new Date(dt).getTime();
          return t >= slotStart.getTime() && t <= slotEnd.getTime();
        };

        const bOrders = periodOrders.filter((o) => inSlot(o.createdAt));
        const bEarn = periodActiveEarnings.filter((e) => inSlot(e.completedAt));
        const bLedger = periodLedgerEntries.filter((l) => inSlot(l.entryDate));

        const grossCod = this.round2(bEarn.reduce((s, e) => s + Number(e.grossAmount), 0));
        const autoFees = this.round2(bEarn.reduce((s, e) => s + Number(e.feeAmount), 0));
        const manualIncome = this.round2(
          bLedger.filter((l) => l.type === 'INCOME').reduce((s, l) => s + Number(l.amount), 0),
        );
        const expenses = this.round2(
          bLedger.filter((l) => l.type === 'EXPENSE').reduce((s, l) => s + Number(l.amount), 0),
        );
        const revenue3pl = this.round2(autoFees + manualIncome);

        const labelHour =
          startHour === 0
            ? '12AM'
            : startHour < 12
              ? `${startHour}AM`
              : startHour === 12
                ? '12PM'
                : `${startHour - 12}PM`;
        buckets.push({
          label: labelHour,
          dateKey: `${toLocalDateKey(window.start)}T${String(startHour).padStart(2, '0')}`,
          totalOrders: bOrders.length,
          deliveredOrders: bOrders.filter(
            (o) => o.status === 'DELIVERED' || o.status === 'PARTIAL_DELIVERED',
          ).length,
          returnedOrders: bOrders.filter((o) => o.status === 'RETURNED').length,
          cancelledOrders: bOrders.filter((o) => o.status === 'CANCELLED').length,
          grossCod,
          revenue3pl,
          expenses,
          netProfit: this.round2(revenue3pl - expenses),
        });
      }
      return buckets;
    }

    const diffDays = Math.max(
      1,
      Math.ceil((window.end.getTime() - window.start.getTime()) / DAY_MS),
    );

    if (!window.isAllTime && diffDays <= 45) {
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(
          window.start.getFullYear(),
          window.start.getMonth(),
          window.start.getDate() + i,
          0,
          0,
          0,
          0,
        );
        if (d.getTime() > window.end.getTime()) break;
        const key = toLocalDateKey(d);

        const bOrders = periodOrders.filter((o) => toLocalDateKey(new Date(o.createdAt)) === key);
        const bEarn = periodActiveEarnings.filter(
          (e) => toLocalDateKey(new Date(e.completedAt)) === key,
        );
        const bLedger = periodLedgerEntries.filter(
          (l) => toLocalDateKey(new Date(l.entryDate)) === key,
        );

        const grossCod = this.round2(bEarn.reduce((s, e) => s + Number(e.grossAmount), 0));
        const autoFees = this.round2(bEarn.reduce((s, e) => s + Number(e.feeAmount), 0));
        const manualIncome = this.round2(
          bLedger.filter((l) => l.type === 'INCOME').reduce((s, l) => s + Number(l.amount), 0),
        );
        const expenses = this.round2(
          bLedger.filter((l) => l.type === 'EXPENSE').reduce((s, l) => s + Number(l.amount), 0),
        );
        const revenue3pl = this.round2(autoFees + manualIncome);

        buckets.push({
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dateKey: key,
          totalOrders: bOrders.length,
          deliveredOrders: bOrders.filter(
            (o) => o.status === 'DELIVERED' || o.status === 'PARTIAL_DELIVERED',
          ).length,
          returnedOrders: bOrders.filter((o) => o.status === 'RETURNED').length,
          cancelledOrders: bOrders.filter((o) => o.status === 'CANCELLED').length,
          grossCod,
          revenue3pl,
          expenses,
          netProfit: this.round2(revenue3pl - expenses),
        });
      }
      return buckets;
    }

    const now = new Date();
    let earliest = window.start;
    if (window.isAllTime) {
      const dates: number[] = [
        ...periodOrders.map((o) => new Date(o.createdAt).getTime()),
        ...periodActiveEarnings.map((e) => new Date(e.completedAt).getTime()),
        ...periodLedgerEntries.map((l) => new Date(l.entryDate).getTime()),
      ].filter((t) => Number.isFinite(t));
      if (dates.length > 0) {
        earliest = new Date(Math.min(...dates));
      }
    }

    const startMonth = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    const endMonth = new Date(
      (window.isAllTime ? now : window.end).getFullYear(),
      (window.isAllTime ? now : window.end).getMonth(),
      1,
    );

    const monthList: Date[] = [];
    const cursor = new Date(startMonth);
    while (cursor.getTime() <= endMonth.getTime()) {
      monthList.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const cappedMonths = monthList.slice(-12);
    const toMonthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    for (const m of cappedMonths) {
      const mKey = toMonthKey(m);
      const bOrders = periodOrders.filter((o) => toMonthKey(new Date(o.createdAt)) === mKey);
      const bEarn = periodActiveEarnings.filter(
        (e) => toMonthKey(new Date(e.completedAt)) === mKey,
      );
      const bLedger = periodLedgerEntries.filter(
        (l) => toMonthKey(new Date(l.entryDate)) === mKey,
      );

      const grossCod = this.round2(bEarn.reduce((s, e) => s + Number(e.grossAmount), 0));
      const autoFees = this.round2(bEarn.reduce((s, e) => s + Number(e.feeAmount), 0));
      const manualIncome = this.round2(
        bLedger.filter((l) => l.type === 'INCOME').reduce((s, l) => s + Number(l.amount), 0),
      );
      const expenses = this.round2(
        bLedger.filter((l) => l.type === 'EXPENSE').reduce((s, l) => s + Number(l.amount), 0),
      );
      const revenue3pl = this.round2(autoFees + manualIncome);

      buckets.push({
        label: m.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        dateKey: mKey,
        totalOrders: bOrders.length,
        deliveredOrders: bOrders.filter(
          (o) => o.status === 'DELIVERED' || o.status === 'PARTIAL_DELIVERED',
        ).length,
        returnedOrders: bOrders.filter((o) => o.status === 'RETURNED').length,
        cancelledOrders: bOrders.filter((o) => o.status === 'CANCELLED').length,
        grossCod,
        revenue3pl,
        expenses,
        netProfit: this.round2(revenue3pl - expenses),
      });
    }

    return buckets;
  }

  /**
   * Admin: Overall 3PL Finance, COD Settlement, Profit & Loss, and Order Volume Analytics
   */
  async getAdminFinanceAnalytics(params?: {
    preset?: string;
    startDate?: string;
    endDate?: string;
    merchantIdentifier?: string;
  }): Promise<AdminFinanceAnalyticsDto> {
    let resolvedMerchant: any = null;
    if (params?.merchantIdentifier && params.merchantIdentifier !== 'ALL') {
      resolvedMerchant = await this.repository.resolveMerchant(params.merchantIdentifier);
      if (!resolvedMerchant) {
        throw new NotFoundException(`Merchant '${params.merchantIdentifier}' not found.`);
      }
    }

    await this.syncMerchantEarnings(resolvedMerchant?.id);

    const raw = await this.repository.getFinanceAnalyticsRawData(resolvedMerchant?.id);
    const window = this.resolveFinanceDateWindow(
      params?.preset,
      params?.startDate,
      params?.endDate,
    );

    const inWindow = (dt: any) => {
      if (window.isAllTime) return true;
      const t = new Date(dt).getTime();
      return t >= window.start.getTime() && t <= window.end.getTime();
    };

    const activeEarnings = raw.earnings.filter((e: any) => e.status !== 'REFUNDED');
    const periodActiveEarnings = activeEarnings.filter((e: any) => inWindow(e.completedAt));

    const totalOrderBillCollected = this.round2(
      periodActiveEarnings.reduce((s: number, e: any) => s + Number(e.grossAmount), 0),
    );
    const deliveryFeesDeducted = this.round2(
      periodActiveEarnings.reduce((s: number, e: any) => s + Number(e.deliveryFee), 0),
    );
    const handlingAndPackagingDeducted = this.round2(
      periodActiveEarnings.reduce(
        (s: number, e: any) => s + Number(e.handlingFee) + Number(e.packagingFee),
        0,
      ),
    );
    const totalPlatformFeesDeducted = this.round2(
      periodActiveEarnings.reduce((s: number, e: any) => s + Number(e.feeAmount), 0),
    );
    const merchantNetPayable = this.round2(
      periodActiveEarnings.reduce((s: number, e: any) => s + Number(e.netAmount), 0),
    );

    const paidRequests = raw.payoutRequests.filter((r: any) => r.status === 'PAID');
    const paidLegacySettlements = raw.settlements.filter(
      (s: any) => s.isPaid && !s.payoutRequestId,
    );

    const totalPaidToMerchants = this.round2(
      paidRequests
        .filter((r: any) => inWindow(r.paidAt || r.updatedAt || r.requestedAt))
        .reduce((s: number, r: any) => s + Number(r.amount), 0) +
        paidLegacySettlements
          .filter((s: any) => inWindow(s.paidAt || s.createdAt))
          .reduce((sum: number, s: any) => sum + Number(s.netPayout), 0),
    );

    const allTimePaidToMerchants = this.round2(
      paidRequests.reduce((s: number, r: any) => s + Number(r.amount), 0) +
        paidLegacySettlements.reduce((sum: number, s: any) => sum + Number(s.netPayout), 0),
    );

    const scopedMerchants = resolvedMerchant ? [resolvedMerchant] : raw.merchants;
    let pendingReturnWindowHold = 0;
    let readyToClaimAndWalletBalance = 0;
    let pendingPayoutRequestsAmount = 0;

    for (const m of scopedMerchants) {
      const mEarnings = raw.earnings.filter((e: any) => e.merchantId === m.id);
      const mRequests = raw.payoutRequests.filter((r: any) => r.merchantId === m.id);
      const mSettlements = (raw.settlements || []).filter((s: any) => s.merchantId === m.id);
      const bal = this.computeBalances(mEarnings, mRequests, mSettlements);
      pendingReturnWindowHold = this.round2(pendingReturnWindowHold + bal.pendingEarnings);
      readyToClaimAndWalletBalance = this.round2(
        readyToClaimAndWalletBalance + bal.withdrawableTotal,
      );
      pendingPayoutRequestsAmount = this.round2(pendingPayoutRequestsAmount + bal.upcomingPayout);
    }

    const pendingPayoutRequestsCount = raw.payoutRequests.filter(
      (r: any) => r.status === 'PENDING' || r.status === 'ACCEPTED',
    ).length;

    const totalUnpaidMerchantLiability = this.round2(
      pendingReturnWindowHold + readyToClaimAndWalletBalance + pendingPayoutRequestsAmount,
    );

    const autoHandlingRevenue = this.round2(
      periodActiveEarnings.reduce((s: number, e: any) => s + Number(e.handlingFee), 0),
    );
    const autoPackagingRevenue = this.round2(
      periodActiveEarnings.reduce((s: number, e: any) => s + Number(e.packagingFee), 0),
    );
    const autoDeliveryFeeRevenue = deliveryFeesDeducted;
    const autoOrderFeeRevenue = this.round2(
      autoHandlingRevenue + autoPackagingRevenue + autoDeliveryFeeRevenue,
    );

    const periodLedgerEntries = raw.financeEntries.filter((entry: any) =>
      inWindow(entry.entryDate),
    );

    const manualStorageIncome = this.round2(
      periodLedgerEntries
        .filter((e: any) => e.type === 'INCOME' && e.category === 'STORAGE_FEE')
        .reduce((s: number, e: any) => s + Number(e.amount), 0),
    );
    const manualOtherIncome = this.round2(
      periodLedgerEntries
        .filter((e: any) => e.type === 'INCOME' && e.category === 'OTHER_INCOME')
        .reduce((s: number, e: any) => s + Number(e.amount), 0),
    );

    const gross3plRevenue = this.round2(
      autoOrderFeeRevenue + manualStorageIncome + manualOtherIncome,
    );

    const expenseEntries = periodLedgerEntries.filter((e: any) => e.type === 'EXPENSE');
    const totalOperatingExpenses = this.round2(
      expenseEntries.reduce((s: number, e: any) => s + Number(e.amount), 0),
    );

    const netProfit = this.round2(gross3plRevenue - totalOperatingExpenses);
    const netMarginPercentage =
      gross3plRevenue > 0
        ? this.round2((netProfit / gross3plRevenue) * 100)
        : totalOperatingExpenses > 0
          ? -100
          : 0;

    const revenueStreams = [
      {
        id: 'handling',
        label: 'Handling Fees (Delivered Orders)',
        source: 'AUTO_ORDER_FEE' as const,
        amount: autoHandlingRevenue,
        sharePercentage:
          gross3plRevenue > 0 ? this.round2((autoHandlingRevenue / gross3plRevenue) * 100) : 0,
      },
      {
        id: 'delivery',
        label: 'Delivery Charges Realized',
        source: 'AUTO_ORDER_FEE' as const,
        amount: autoDeliveryFeeRevenue,
        sharePercentage:
          gross3plRevenue > 0 ? this.round2((autoDeliveryFeeRevenue / gross3plRevenue) * 100) : 0,
      },
      {
        id: 'packaging',
        label: 'Packaging Fees (Materials)',
        source: 'AUTO_ORDER_FEE' as const,
        amount: autoPackagingRevenue,
        sharePercentage:
          gross3plRevenue > 0 ? this.round2((autoPackagingRevenue / gross3plRevenue) * 100) : 0,
      },
      {
        id: 'storage',
        label: 'Warehouse Storage Fees (Manual)',
        source: 'MANUAL_LEDGER' as const,
        amount: manualStorageIncome,
        sharePercentage:
          gross3plRevenue > 0 ? this.round2((manualStorageIncome / gross3plRevenue) * 100) : 0,
      },
      {
        id: 'other_income',
        label: 'Other 3PL Income (Manual)',
        source: 'MANUAL_LEDGER' as const,
        amount: manualOtherIncome,
        sharePercentage:
          gross3plRevenue > 0 ? this.round2((manualOtherIncome / gross3plRevenue) * 100) : 0,
      },
    ];

    const expensesByCategory = EXPENSE_CATEGORY_META.map((meta) => {
      const matching = expenseEntries.filter((e: any) => e.category === meta.category);
      const amount = this.round2(matching.reduce((s: number, e: any) => s + Number(e.amount), 0));
      return {
        category: meta.category,
        label: meta.label,
        amount,
        sharePercentage:
          totalOperatingExpenses > 0
            ? this.round2((amount / totalOperatingExpenses) * 100)
            : 0,
        entriesCount: matching.length,
      };
    });

    const periodOrders = raw.orders.filter((o: any) => inWindow(o.createdAt));
    const deliveredOrders = periodOrders.filter(
      (o: any) => o.status === 'DELIVERED' || o.status === 'PARTIAL_DELIVERED',
    );
    const dispatchedInTransitOrders = periodOrders.filter(
      (o: any) => o.status === 'DISPATCHED',
    );
    const returnedOrders = periodOrders.filter((o: any) => o.status === 'RETURNED');
    const cancelledOrders = periodOrders.filter((o: any) => o.status === 'CANCELLED');
    const pendingAndProcessingOrders = periodOrders.filter((o: any) =>
      ['PENDING', 'ON_HOLD_STOCK', 'ON_HOLD_FRAUD', 'ALLOCATED', 'PICKING', 'PACKED'].includes(
        o.status,
      ),
    );

    const terminalOrdersCount = deliveredOrders.length + returnedOrders.length;
    const deliverySuccessRate =
      terminalOrdersCount > 0
        ? this.round2((deliveredOrders.length / terminalOrdersCount) * 100)
        : 0;
    const returnRate =
      terminalOrdersCount > 0
        ? this.round2((returnedOrders.length / terminalOrdersCount) * 100)
        : 0;
    const returnedOrderValue = this.round2(
      returnedOrders.reduce(
        (s: number, o: any) => s + Number(o.totalAmount || o.codAmount || 0),
        0,
      ),
    );

    const buckets = this.buildFinanceTimeSeriesBuckets(
      window,
      periodOrders,
      periodActiveEarnings,
      periodLedgerEntries,
    );

    const merchantBreakdown: FinanceMerchantBreakdownDto[] = scopedMerchants.map((m: any) => {
      const mPeriodOrders = periodOrders.filter((o: any) => o.merchantId === m.id);
      const mPeriodEarn = periodActiveEarnings.filter((e: any) => e.merchantId === m.id);
      const mAllEarnings = raw.earnings.filter((e: any) => e.merchantId === m.id);
      const mAllRequests = raw.payoutRequests.filter((r: any) => r.merchantId === m.id);
      const mAllSettlements = (raw.settlements || []).filter((s: any) => s.merchantId === m.id);
      const mBal = this.computeBalances(mAllEarnings, mAllRequests, mAllSettlements);

      const mPeriodPaidReq = mAllRequests
        .filter(
          (r: any) =>
            r.status === 'PAID' && inWindow(r.paidAt || r.updatedAt || r.requestedAt),
        )
        .reduce((s: number, r: any) => s + Number(r.amount), 0);
      const mPeriodLegacy = raw.settlements
        .filter(
          (s: any) =>
            s.merchantId === m.id &&
            s.isPaid &&
            !s.payoutRequestId &&
            inWindow(s.paidAt || s.createdAt),
        )
        .reduce((s: number, st: any) => s + Number(st.netPayout), 0);

      const handlingFees = this.round2(
        mPeriodEarn.reduce((s: number, e: any) => s + Number(e.handlingFee), 0),
      );
      const packagingFees = this.round2(
        mPeriodEarn.reduce((s: number, e: any) => s + Number(e.packagingFee), 0),
      );
      const deliveryFees = this.round2(
        mPeriodEarn.reduce((s: number, e: any) => s + Number(e.deliveryFee), 0),
      );

      return {
        merchantId: m.id,
        merchantCode: m.merchantCode,
        merchantName: m.businessName,
        ownerName: m.ownerName || 'Store Owner',
        totalOrders: mPeriodOrders.length,
        deliveredOrders: mPeriodOrders.filter(
          (o: any) => o.status === 'DELIVERED' || o.status === 'PARTIAL_DELIVERED',
        ).length,
        returnedOrders: mPeriodOrders.filter((o: any) => o.status === 'RETURNED').length,
        cancelledOrders: mPeriodOrders.filter((o: any) => o.status === 'CANCELLED').length,
        grossCodCollected: this.round2(
          mPeriodEarn.reduce((s: number, e: any) => s + Number(e.grossAmount), 0),
        ),
        handlingFees,
        packagingFees,
        deliveryFees,
        total3plFees: this.round2(handlingFees + packagingFees + deliveryFees),
        merchantNetEarned: this.round2(
          mPeriodEarn.reduce((s: number, e: any) => s + Number(e.netAmount), 0),
        ),
        totalPaidOut: this.round2(mPeriodPaidReq + mPeriodLegacy),
        currentUnpaidDue: this.round2(
          mBal.pendingEarnings + mBal.withdrawableTotal + mBal.upcomingPayout,
        ),
        pendingPayoutCount: mAllRequests.filter(
          (r: any) => r.status === 'PENDING' || r.status === 'ACCEPTED',
        ).length,
      };
    });

    return {
      filter: {
        preset: window.preset,
        startDate: window.start.toISOString(),
        endDate: window.end.toISOString(),
        label: window.label,
        merchantId: resolvedMerchant?.id || null,
        merchantCode: resolvedMerchant?.merchantCode || null,
        merchantName: resolvedMerchant?.businessName || null,
      },
      merchantsList: raw.merchants.map((m: any) => ({
        id: m.id,
        merchantCode: m.merchantCode,
        businessName: m.businessName,
      })),
      codSettlement: {
        totalOrderBillCollected,
        totalPlatformFeesDeducted,
        deliveryFeesDeducted,
        handlingAndPackagingDeducted,
        merchantNetPayable,
        deliveredOrdersInPeriod: periodActiveEarnings.length,
        totalPaidToMerchants,
        allTimePaidToMerchants,
        pendingReturnWindowHold,
        readyToClaimAndWalletBalance,
        pendingPayoutRequestsAmount,
        pendingPayoutRequestsCount,
        totalUnpaidMerchantLiability,
      },
      companyProfitLoss: {
        isMerchantScoped: Boolean(resolvedMerchant),
        autoHandlingRevenue,
        autoPackagingRevenue,
        autoDeliveryFeeRevenue,
        autoOrderFeeRevenue,
        manualStorageIncome,
        manualOtherIncome,
        gross3plRevenue,
        totalOperatingExpenses,
        netProfit,
        netMarginPercentage,
        isProfitable: netProfit >= 0,
        revenueStreams,
        expensesByCategory,
      },
      orderVolume: {
        totalOrders: periodOrders.length,
        deliveredOrders: deliveredOrders.length,
        dispatchedInTransitOrders: dispatchedInTransitOrders.length,
        pendingAndProcessingOrders: pendingAndProcessingOrders.length,
        returnedOrders: returnedOrders.length,
        cancelledOrders: cancelledOrders.length,
        deliverySuccessRate,
        returnRate,
        returnedOrderValue,
        buckets,
      },
      merchantBreakdown,
      ledgerEntries: periodLedgerEntries.map((e: any) => this.mapFinanceEntryToDto(e)),
    };
  }

  /**
   * Admin: Live Operations Dashboard payload (orders pipeline, pending actions, couriers, bins, activity)
   */
  async getAdminOperationsDashboard(): Promise<AdminOperationsDashboardDto> {
    const raw = await this.repository.getOperationsDashboardRawData();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const orders = raw.orders || [];
    const pendingCount = orders.filter((o: any) => o.status === 'PENDING').length;
    const onHoldCount = orders.filter(
      (o: any) => o.status === 'ON_HOLD_STOCK' || o.status === 'ON_HOLD_FRAUD',
    ).length;
    const pickingAndAllocatedCount = orders.filter(
      (o: any) => o.status === 'ALLOCATED' || o.status === 'PICKING',
    ).length;
    const pendingAndProcessingCount = pendingCount + onHoldCount + pickingAndAllocatedCount;
    const packedAndReadyCount = orders.filter((o: any) => o.status === 'PACKED').length;
    const dispatchedInTransitCount = orders.filter((o: any) => o.status === 'DISPATCHED').length;
    const deliveredAll = orders.filter(
      (o: any) => o.status === 'DELIVERED' || o.status === 'PARTIAL_DELIVERED',
    );
    const deliveredTodayCount = deliveredAll.filter((o: any) => {
      const dt = new Date(o.deliveredAt || o.updatedAt || o.createdAt);
      return dt.getTime() >= todayStart.getTime();
    }).length;
    const returnedCount = orders.filter((o: any) => o.status === 'RETURNED').length;
    const cancelledCount = orders.filter((o: any) => o.status === 'CANCELLED').length;
    const terminalCount = deliveredAll.length + returnedCount;
    const deliverySuccessRate =
      terminalCount > 0 ? this.round2((deliveredAll.length / terminalCount) * 100) : 0;

    const pendingPayouts = raw.pendingPayouts || [];
    const pendingPayoutRequestsAmount = this.round2(
      pendingPayouts.reduce((s: number, r: any) => s + Number(r.amount || 0), 0),
    );
    const totalActionItems =
      Number(raw.pendingMerchantsCount || 0) +
      Number(raw.pendingProductApprovalsCount || 0) +
      Number(raw.pendingRestockRequestsCount || 0) +
      pendingPayouts.length +
      Number(raw.pendingReturnRequestsCount || 0);

    const coreProviders: Array<{ key: string; label: string }> = [
      { key: 'STEADFAST', label: 'Steadfast Courier' },
      { key: 'PATHAO', label: 'Pathao Courier' },
      { key: 'REDX', label: 'RedX Logistics' },
    ];
    const extraProviders = new Set<string>(
      orders
        .map((o: any) => o.courierProvider)
        .filter((p: any) => p && !['STEADFAST', 'PATHAO', 'REDX'].includes(p)),
    );
    for (const p of extraProviders) {
      coreProviders.push({ key: p, label: p.charAt(0) + p.slice(1).toLowerCase() });
    }

    const totalAssignedParcels = orders.filter((o: any) => Boolean(o.courierProvider)).length;
    const couriers: AdminOperationsCourierDto[] = coreProviders.map((cp) => {
      const cOrders = orders.filter((o: any) => o.courierProvider === cp.key);
      const cDelivered = cOrders.filter(
        (o: any) => o.status === 'DELIVERED' || o.status === 'PARTIAL_DELIVERED',
      );
      const cInTransit = cOrders.filter((o: any) => o.status === 'DISPATCHED');
      const cReturned = cOrders.filter((o: any) => o.status === 'RETURNED');
      const cTerminal = cDelivered.length + cReturned.length;
      const rate = cTerminal > 0 ? this.round2((cDelivered.length / cTerminal) * 100) : 0;
      const rRate = cTerminal > 0 ? this.round2((cReturned.length / cTerminal) * 100) : 0;
      const codInTransitAmount = this.round2(
        cInTransit.reduce((s: number, o: any) => s + Number(o.codAmount || o.totalAmount || 0), 0),
      );
      const status: 'optimal' | 'healthy' | 'delayed' =
        cTerminal === 0 || rate >= 85 ? 'optimal' : rate >= 70 ? 'healthy' : 'delayed';

      return {
        provider: cp.key,
        label: cp.label,
        totalParcels: cOrders.length,
        sharePercentage:
          totalAssignedParcels > 0
            ? this.round2((cOrders.length / totalAssignedParcels) * 100)
            : 0,
        deliveredCount: cDelivered.length,
        inTransitCount: cInTransit.length,
        returnedCount: cReturned.length,
        deliverySuccessRate: rate,
        returnRate: rRate,
        codInTransitAmount,
        status,
      };
    });

    const zoneMap = new Map<
      string,
      {
        binCount: number;
        skuIds: Set<string>;
        availableUnits: number;
        reservedUnits: number;
        damagedUnits: number;
        reorderAlerts: number;
      }
    >();
    const allSkus = new Set<string>();
    let totalAvailableUnits = 0;
    let totalReservedUnits = 0;
    let totalDamagedUnits = 0;

    for (const loc of raw.inventoryLocations || []) {
      const zoneName = loc.zone || 'Primary Zone';
      if (!zoneMap.has(zoneName)) {
        zoneMap.set(zoneName, {
          binCount: 0,
          skuIds: new Set<string>(),
          availableUnits: 0,
          reservedUnits: 0,
          damagedUnits: 0,
          reorderAlerts: 0,
        });
      }
      const bucket = zoneMap.get(zoneName)!;
      bucket.binCount += 1;

      for (const item of loc.items || []) {
        const avail = Number(item.quantityAvailable || 0);
        const res = Number(item.quantityReserved || 0);
        const dmg = Number(item.quantityDamaged || 0);
        if (avail + res + dmg > 0) {
          bucket.skuIds.add(item.variantId);
          allSkus.add(item.variantId);
        }
        bucket.availableUnits += avail;
        bucket.reservedUnits += res;
        bucket.damagedUnits += dmg;
        if (avail <= Number(item.reorderPoint || 10)) {
          bucket.reorderAlerts += 1;
        }
        totalAvailableUnits += avail;
        totalReservedUnits += res;
        totalDamagedUnits += dmg;
      }
    }

    const zones: AdminOperationsZoneCapacityDto[] = Array.from(zoneMap.entries()).map(
      ([zone, info]) => ({
        zoneId: zone.toLowerCase().replace(/\s+/g, '-'),
        zone,
        binCount: info.binCount,
        skuCount: info.skuIds.size,
        availableUnits: info.availableUnits,
        reservedUnits: info.reservedUnits,
        damagedUnits: info.damagedUnits,
        totalUnits: info.availableUnits + info.reservedUnits + info.damagedUnits,
        reorderAlerts: info.reorderAlerts,
      }),
    );

    const logs = raw.recentActivityLogs || [];
    let recentActivity: AdminOperationsActivityDto[] = [];
    if (logs.length > 0) {
      recentActivity = logs.map((log: any) => {
        const entity = String(log.entityType || '').toLowerCase();
        const type: AdminOperationsActivityDto['type'] =
          entity.includes('payout') || entity.includes('earning')
            ? 'payout'
            : entity.includes('merchant')
              ? 'merchant'
              : entity.includes('inbound')
                ? 'inbound'
                : entity.includes('product') || entity.includes('inventory')
                  ? 'inventory'
                  : entity.includes('order')
                    ? 'order'
                    : 'system';
        return {
          id: log.id,
          title: String(log.action || 'SYSTEM_EVENT').replace(/_/g, ' '),
          details: log.notes || `${log.entityType} (${log.entityId}) updated.`,
          type,
          createdAt: new Date(log.createdAt).toISOString(),
        };
      });
    } else {
      recentActivity = orders.slice(0, 8).map((o: any) => ({
        id: o.id,
        title: `Order ${o.externalOrderId || o.id.slice(0, 8)} • ${o.status}`,
        details: `${o.merchant?.businessName || 'Merchant'} — ${o.customerName} (৳${Number(o.totalAmount || 0).toLocaleString()})`,
        type: 'order' as const,
        createdAt: new Date(o.updatedAt || o.createdAt).toISOString(),
      }));
    }

    return {
      generatedAt: now.toISOString(),
      pipeline: {
        pendingAndProcessingCount,
        pendingCount,
        onHoldCount,
        pickingAndAllocatedCount,
        packedAndReadyCount,
        dispatchedInTransitCount,
        deliveredTodayCount,
        totalDeliveredAllTime: deliveredAll.length,
        returnedAndCancelledCount: returnedCount + cancelledCount,
        returnedCount,
        cancelledCount,
        totalOrdersAllTime: orders.length,
        deliverySuccessRate,
      },
      actionCenter: {
        pendingMerchantsCount: Number(raw.pendingMerchantsCount || 0),
        pendingProductApprovalsCount: Number(raw.pendingProductApprovalsCount || 0),
        pendingRestockRequestsCount: Number(raw.pendingRestockRequestsCount || 0),
        pendingPayoutRequestsCount: pendingPayouts.length,
        pendingPayoutRequestsAmount,
        pendingReturnRequestsCount: Number(raw.pendingReturnRequestsCount || 0),
        totalActionItems,
      },
      couriers,
      warehouseCapacity: {
        totalBins: (raw.inventoryLocations || []).length,
        totalSkusInStock: allSkus.size,
        totalAvailableUnits,
        totalReservedUnits,
        totalDamagedUnits,
        zones,
      },
      recentActivity,
    };
  }
}