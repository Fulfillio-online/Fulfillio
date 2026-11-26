import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveMerchant(identifier?: string) {
    const clean = (identifier || '').trim();
    if (!clean) {
      return this.prisma.merchant.findFirst({
        orderBy: { createdAt: 'asc' },
      });
    }

    const upper = clean.toUpperCase();
    const fromAlias = clean.toLowerCase().startsWith('m-')
      ? `MC-${clean.slice(2)}`.toUpperCase()
      : upper;

    return this.prisma.merchant.findFirst({
      where: {
        OR: [
          { id: clean },
          { merchantCode: { equals: upper, mode: 'insensitive' } },
          { merchantCode: { equals: fromAlias, mode: 'insensitive' } },
          { email: clean.toLowerCase() },
        ],
      },
    });
  }

  async lockMerchantRow(tx: any, merchantId: string) {
    if (typeof tx.$queryRaw === 'function') {
      await tx.$queryRaw`SELECT "id" FROM "merchants" WHERE "id" = ${merchantId} FOR UPDATE`;
    }
  }

  async findOrderWithDetails(orderIdOrExternal: string, tx: any = this.prisma) {
    const clean = (orderIdOrExternal || '').replace(/^#/, '').trim();
    if (!clean) return null;

    return tx.order.findFirst({
      where: {
        OR: [
          { id: orderIdOrExternal },
          { id: clean },
          { externalOrderId: orderIdOrExternal },
          { externalOrderId: clean },
          { externalOrderId: `#${clean}` },
        ],
      },
      include: {
        merchant: true,
        items: true,
        earning: true,
      },
    });
  }

  async findCompletedOrdersWithoutEarning(merchantId?: string, tx: any = this.prisma) {
    return tx.order.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
        status: { in: ['DELIVERED', 'PARTIAL_DELIVERED'] },
        earning: { is: null },
      },
      include: {
        merchant: true,
        items: true,
      },
    });
  }

  async findEarningsNeedingRefundSync(merchantId?: string, tx: any = this.prisma) {
    return tx.orderEarning.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
        status: { in: ['PENDING', 'READY_TO_CLAIM', 'CLAIMED'] },
        order: {
          status: { in: ['RETURNED', 'CANCELLED'] },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            returnedAt: true,
            cancelledAt: true,
            cancelReason: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async findRefundedEarningsReactivated(merchantId?: string, tx: any = this.prisma) {
    return tx.orderEarning.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
        status: 'REFUNDED',
        order: {
          status: { in: ['DELIVERED', 'PARTIAL_DELIVERED'] },
        },
      },
      include: {
        order: {
          include: {
            merchant: true,
            items: true,
          },
        },
      },
    });
  }

  async promoteMaturePendingEarnings(now: Date, merchantId?: string, tx: any = this.prisma) {
    return tx.orderEarning.updateMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
        status: 'PENDING',
        claimableAt: { lte: now },
      },
      data: {
        status: 'READY_TO_CLAIM',
      },
    });
  }

  async upsertOrderEarning(
    data: {
      transactionRef: string;
      merchantId: string;
      orderId: string;
      orderNumber: string;
      itemSummary: string;
      grossAmount: number;
      deliveryFee: number;
      handlingFee: number;
      packagingFee: number;
      feeAmount: number;
      netAmount: number;
      status: 'PENDING' | 'READY_TO_CLAIM' | 'CLAIMED' | 'REFUNDED';
      returnWindowDays: number;
      completedAt: Date;
      claimableAt: Date;
      refundedAt?: Date | null;
      refundReason?: string | null;
    },
    tx: any = this.prisma,
  ) {
    return tx.orderEarning.upsert({
      where: { orderId: data.orderId },
      update: {
        itemSummary: data.itemSummary,
        grossAmount: data.grossAmount,
        deliveryFee: data.deliveryFee,
        handlingFee: data.handlingFee,
        packagingFee: data.packagingFee,
        feeAmount: data.feeAmount,
        netAmount: data.netAmount,
        status: data.status,
        returnWindowDays: data.returnWindowDays,
        completedAt: data.completedAt,
        claimableAt: data.claimableAt,
        refundedAt: data.refundedAt ?? null,
        refundReason: data.refundReason ?? null,
      },
      create: {
        transactionRef: data.transactionRef,
        merchantId: data.merchantId,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        itemSummary: data.itemSummary,
        grossAmount: data.grossAmount,
        deliveryFee: data.deliveryFee,
        handlingFee: data.handlingFee,
        packagingFee: data.packagingFee,
        feeAmount: data.feeAmount,
        netAmount: data.netAmount,
        status: data.status,
        returnWindowDays: data.returnWindowDays,
        completedAt: data.completedAt,
        claimableAt: data.claimableAt,
        refundedAt: data.refundedAt ?? null,
        refundReason: data.refundReason ?? null,
      },
    });
  }

  async markEarningRefunded(
    earningId: string,
    refundedAt: Date,
    refundReason: string,
    tx: any = this.prisma,
  ) {
    return tx.orderEarning.update({
      where: { id: earningId },
      data: {
        status: 'REFUNDED',
        refundedAt,
        refundReason,
      },
    });
  }

  async findMerchantEarnings(merchantId: string, tx: any = this.prisma) {
    return tx.orderEarning.findMany({
      where: { merchantId },
      include: {
        order: {
          select: {
            customerName: true,
            status: true,
          },
        },
        merchant: {
          select: {
            merchantCode: true,
            businessName: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  async findAdminOrderEarnings(
    filters: {
      merchantId?: string;
      status?: string;
      search?: string;
    },
    tx: any = this.prisma,
  ) {
    const where: any = {};
    if (filters.merchantId) where.merchantId = filters.merchantId;
    if (filters.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { transactionRef: { contains: q, mode: 'insensitive' } },
        { itemSummary: { contains: q, mode: 'insensitive' } },
        {
          merchant: {
            OR: [
              { businessName: { contains: q, mode: 'insensitive' } },
              { merchantCode: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    return tx.orderEarning.findMany({
      where,
      include: {
        merchant: {
          select: {
            id: true,
            merchantCode: true,
            businessName: true,
          },
        },
        order: {
          select: {
            customerName: true,
            status: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  async findEarningById(earningId: string, tx: any = this.prisma) {
    return tx.orderEarning.findUnique({
      where: { id: earningId },
      include: {
        merchant: {
          select: {
            id: true,
            merchantCode: true,
            businessName: true,
          },
        },
        order: {
          select: {
            customerName: true,
            status: true,
          },
        },
      },
    });
  }

  async findMerchantPayoutRequests(merchantId: string, tx: any = this.prisma) {
    return tx.payoutRequest.findMany({
      where: { merchantId },
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
      orderBy: { requestedAt: 'desc' },
    });
  }

  async findAllPayoutRequests(
    filters?: {
      merchantId?: string;
      status?: string;
      method?: string;
      search?: string;
    },
    tx: any = this.prisma,
  ) {
    const where: any = {};
    if (filters?.merchantId) where.merchantId = filters.merchantId;
    if (filters?.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters?.method && filters.method !== 'ALL') where.method = filters.method;
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { requestCode: { contains: q, mode: 'insensitive' } },
        { trxId: { contains: q, mode: 'insensitive' } },
        { accountNumber: { contains: q, mode: 'insensitive' } },
        { provider: { contains: q, mode: 'insensitive' } },
        {
          merchant: {
            OR: [
              { businessName: { contains: q, mode: 'insensitive' } },
              { merchantCode: { contains: q, mode: 'insensitive' } },
              { ownerName: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    return tx.payoutRequest.findMany({
      where,
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
      orderBy: { requestedAt: 'desc' },
    });
  }

  async findPayoutRequestByIdOrCode(idOrCode: string, tx: any = this.prisma) {
    const clean = (idOrCode || '').trim();
    if (!clean) return null;
    return tx.payoutRequest.findFirst({
      where: {
        OR: [{ id: clean }, { requestCode: clean.toUpperCase() }],
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
  }

  async createSettlement(
    data: {
      merchantId: string;
      payoutRequestId?: string;
      transactionRef?: string;
      paymentMethod?: string;
      accountDetails?: Record<string, any>;
      proofDocumentUrl?: string;
      proofDocumentName?: string;
      proofDocumentMime?: string;
      proofChecksum?: string;
      remarks?: string;
      cycleStart: Date;
      cycleEnd: Date;
      totalCodCollected: number;
      storageFees: number;
      handlingFees: number;
      packagingFees?: number;
      netPayout: number;
      isPaid?: boolean;
      paidAt?: Date;
    },
    tx: any = this.prisma,
  ) {
    return tx.settlement.create({
      data: {
        merchantId: data.merchantId,
        payoutRequestId: data.payoutRequestId,
        transactionRef: data.transactionRef,
        paymentMethod: data.paymentMethod,
        accountDetails: data.accountDetails,
        proofDocumentUrl: data.proofDocumentUrl,
        proofDocumentName: data.proofDocumentName,
        proofDocumentMime: data.proofDocumentMime,
        proofChecksum: data.proofChecksum,
        remarks: data.remarks,
        cycleStart: data.cycleStart,
        cycleEnd: data.cycleEnd,
        totalCodCollected: data.totalCodCollected,
        storageFees: data.storageFees,
        handlingFees: data.handlingFees,
        packagingFees: data.packagingFees || 0,
        netPayout: data.netPayout,
        isPaid: data.isPaid ?? false,
        paidAt: data.paidAt,
      },
    });
  }

  async getMerchantSettlements(merchantId?: string) {
    return this.prisma.settlement.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
      },
      include: {
        merchant: {
          select: {
            id: true,
            merchantCode: true,
            businessName: true,
            ownerName: true,
            phone: true,
            payoutAccount: true,
          },
        },
        payoutRequest: {
          select: {
            id: true,
            requestCode: true,
            method: true,
            provider: true,
            accountNumber: true,
            accountHolder: true,
            trxId: true,
            proofDocumentUrl: true,
            proofDocumentName: true,
            proofDocumentMime: true,
            proofChannel: true,
            proofNotes: true,
            proofChecksum: true,
            paidAt: true,
            paidByAdminName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markSettlementAsPaid(settlementId: string) {
    return this.prisma.settlement.update({
      where: { id: settlementId },
      data: { isPaid: true, paidAt: new Date() },
    });
  }

  async getBillingAggregates(merchantId?: string) {
    const [earnings, payoutRequests, settlements, merchants] = await Promise.all([
      this.prisma.orderEarning.findMany({
        where: { ...(merchantId ? { merchantId } : {}) },
        include: {
          merchant: {
            select: { id: true, merchantCode: true, businessName: true, ownerName: true, phone: true, payoutAccount: true },
          },
        },
      }),
      this.prisma.payoutRequest.findMany({
        where: { ...(merchantId ? { merchantId } : {}) },
      }),
      this.prisma.settlement.findMany({
        where: { ...(merchantId ? { merchantId } : {}) },
      }),
      this.prisma.merchant.findMany({
        where: { ...(merchantId ? { id: merchantId } : {}) },
        select: {
          id: true,
          merchantCode: true,
          businessName: true,
          ownerName: true,
          phone: true,
          payoutAccount: true,
          returnWindowDays: true,
          minPayoutAmount: true,
        },
        orderBy: { merchantCode: 'asc' },
      }),
    ]);

    const activeEarnings = earnings.filter((e) => e.status !== 'REFUNDED');
    const totalGrossCollected = activeEarnings.reduce((sum, e) => sum + Number(e.grossAmount), 0);
    const totalPackagingCost = activeEarnings.reduce((sum, e) => sum + Number(e.packagingFee), 0);
    const totalDeliveryFees = activeEarnings.reduce((sum, e) => sum + Number(e.deliveryFee), 0);
    const totalHandlingFees = activeEarnings.reduce((sum, e) => sum + Number(e.handlingFee), 0);
    const totalNetEarned = activeEarnings.reduce((sum, e) => sum + Number(e.netAmount), 0);
    const totalPendingHold = earnings
      .filter((e) => e.status === 'PENDING')
      .reduce((sum, e) => sum + Number(e.netAmount), 0);
    const totalReadyToClaim = earnings
      .filter((e) => e.status === 'READY_TO_CLAIM')
      .reduce((sum, e) => sum + Number(e.netAmount), 0);

    const paidRequests = payoutRequests.filter((r) => r.status === 'PAID');
    const pendingRequests = payoutRequests.filter(
      (r) => r.status === 'PENDING' || r.status === 'ACCEPTED',
    );
    const totalPaidFromRequests = paidRequests.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalPaidFromLegacySettlements = settlements
      .filter((s) => s.isPaid && !s.payoutRequestId)
      .reduce((sum, s) => sum + Number(s.netPayout), 0);
    const totalPaidPayouts = totalPaidFromRequests + totalPaidFromLegacySettlements;
    const totalPendingPayouts = pendingRequests.reduce((sum, r) => sum + Number(r.amount), 0);

    const merchantProfiles = merchants.map((m) => {
      const mEarnings = earnings.filter((e) => e.merchantId === m.id);
      const mActive = mEarnings.filter((e) => e.status !== 'REFUNDED');
      const mRequests = payoutRequests.filter((r) => r.merchantId === m.id);
      const mPaid = mRequests.filter((r) => r.status === 'PAID');
      const mClaimed = mEarnings
        .filter((e) => e.status === 'CLAIMED')
        .reduce((sum, e) => sum + Number(e.netAmount), 0);
      const mReady = mEarnings
        .filter((e) => e.status === 'READY_TO_CLAIM')
        .reduce((sum, e) => sum + Number(e.netAmount), 0);
      const mPaidSum = mPaid.reduce((sum, r) => sum + Number(r.amount), 0);
      const mLegacyPaidSum = settlements
        .filter((s) => s.merchantId === m.id && s.isPaid && !s.payoutRequestId)
        .reduce((sum, s) => sum + Number(s.netPayout), 0);
      const mTotalPaid = mPaidSum + mLegacyPaidSum;
      const mPendingReqSum = mRequests
        .filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED')
        .reduce((sum, r) => sum + Number(r.amount), 0);
      const payoutAcc = (m.payoutAccount as Record<string, any>) || {};

      return {
        merchantId: m.id,
        merchantCode: m.merchantCode,
        merchantName: m.businessName,
        ownerName: m.ownerName || 'Store Owner',
        phone: m.phone || '',
        totalCodEarned: mActive.reduce((sum, e) => sum + Number(e.grossAmount), 0),
        totalNetEarned: mActive.reduce((sum, e) => sum + Number(e.netAmount), 0),
        totalPaid: mTotalPaid,
        unpaidBalance: Math.max(0, mClaimed + mReady - mTotalPaid - mPendingReqSum),
        withdrawalsCount: mPaid.length,
        returnWindowDays: m.returnWindowDays,
        minPayoutAmount: Number(m.minPayoutAmount),
        payoutAccount: {
          provider: payoutAcc.provider || 'Not Configured',
          accountHolder: payoutAcc.accountHolder || m.ownerName || m.businessName,
          accountNumber: payoutAcc.accountNumber || payoutAcc.bkashMerchantNumber || '',
          bkashNumber: payoutAcc.bkashMerchantNumber || '',
        },
      };
    });

    return {
      totalCodCollected: totalGrossCollected,
      totalNetEarned,
      totalDeliveryFees,
      totalHandlingFees,
      totalPackagingCost,
      totalPendingHold,
      totalReadyToClaim,
      totalPaidPayouts,
      totalPendingPayouts,
      settlementsCount: settlements.length,
      deliveredOrdersCount: activeEarnings.length,
      merchantsCount: merchants.length,
      merchantProfiles,
    };
  }

  async listFinanceEntries(where: any = {}, tx: any = this.prisma) {
    const delegate = tx?.companyFinanceEntry;
    if (!delegate || typeof delegate.findMany !== 'function') {
      return [];
    }
    try {
      return await delegate.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              merchantCode: true,
              businessName: true,
            },
          },
        },
        orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (err: any) {
      if (err?.code === 'P2021' || String(err?.message || '').includes('does not exist')) {
        return [];
      }
      throw err;
    }
  }

  async findFinanceEntryById(id: string, tx: any = this.prisma) {
    const delegate = tx?.companyFinanceEntry;
    if (!delegate) return null;
    return delegate.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            merchantCode: true,
            businessName: true,
          },
        },
      },
    });
  }

  async createFinanceEntry(data: any, tx: any = this.prisma) {
    return tx.companyFinanceEntry.create({
      data,
      include: {
        merchant: {
          select: {
            id: true,
            merchantCode: true,
            businessName: true,
          },
        },
      },
    });
  }

  async updateFinanceEntry(id: string, data: any, tx: any = this.prisma) {
    return tx.companyFinanceEntry.update({
      where: { id },
      data,
      include: {
        merchant: {
          select: {
            id: true,
            merchantCode: true,
            businessName: true,
          },
        },
      },
    });
  }

  async deleteFinanceEntry(id: string, tx: any = this.prisma) {
    return tx.companyFinanceEntry.delete({
      where: { id },
    });
  }

  async getFinanceAnalyticsRawData(merchantId?: string) {
    const [orders, earnings, payoutRequests, settlements, merchants, financeEntries] =
      await Promise.all([
        this.prisma.order.findMany({
          where: merchantId ? { merchantId } : {},
          select: {
            id: true,
            merchantId: true,
            status: true,
            totalAmount: true,
            codAmount: true,
            deliveryFee: true,
            packagingCost: true,
            createdAt: true,
            deliveredAt: true,
            returnedAt: true,
            cancelledAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.orderEarning.findMany({
          where: merchantId ? { merchantId } : {},
        }),
        this.prisma.payoutRequest.findMany({
          where: merchantId ? { merchantId } : {},
        }),
        this.prisma.settlement.findMany({
          where: merchantId ? { merchantId } : {},
        }),
        this.prisma.merchant.findMany({
          select: {
            id: true,
            merchantCode: true,
            businessName: true,
            ownerName: true,
            status: true,
          },
          orderBy: { merchantCode: 'asc' },
        }),
        this.listFinanceEntries(merchantId ? { merchantId } : {}),
      ]);

    return {
      orders,
      earnings,
      payoutRequests,
      settlements,
      merchants,
      financeEntries,
    };
  }

  async getOperationsDashboardRawData() {
    const hasProductEditReq =
      typeof (this.prisma as any).productEditRequest?.findMany === 'function';
    const hasProductCount =
      typeof (this.prisma as any).product?.count === 'function';

    const [
      orders,
      pendingMerchantsCount,
      pendingProductApprovalsCount,
      pendingStockEditRows,
      legacyRestockCount,
      pendingPayouts,
      legacyReturnCount,
      inventoryLocations,
      recentActivityLogs,
    ] = await Promise.all([
      this.prisma.order.findMany({
        select: {
          id: true,
          merchantId: true,
          externalOrderId: true,
          customerName: true,
          status: true,
          courierProvider: true,
          totalAmount: true,
          codAmount: true,
          createdAt: true,
          deliveredAt: true,
          updatedAt: true,
          merchant: {
            select: {
              merchantCode: true,
              businessName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      typeof this.prisma.merchant?.count === 'function'
        ? this.prisma.merchant.count({ where: { status: 'PENDING' } })
        : Promise.resolve(0),
      hasProductEditReq && hasProductCount
        ? (this.prisma as any).product.count({ where: { status: 'PENDING_APPROVAL' } })
        : typeof (this.prisma as any).productApprovalRequest?.count === 'function'
          ? (this.prisma as any).productApprovalRequest.count({ where: { status: 'PENDING' } })
          : Promise.resolve(0),
      hasProductEditReq
        ? (this.prisma as any).productEditRequest.findMany({
            where: { status: 'PENDING' },
            select: { requestedChanges: true },
          })
        : Promise.resolve([]),
      !hasProductEditReq && typeof (this.prisma as any).restockRequest?.count === 'function'
        ? (this.prisma as any).restockRequest.count({ where: { status: 'REQUESTED' } })
        : Promise.resolve(0),
      this.prisma.payoutRequest.findMany({
        where: { status: { in: ['PENDING', 'ACCEPTED'] } },
        select: { id: true, amount: true, status: true },
      }),
      !hasProductEditReq && typeof (this.prisma as any).returnRequest?.count === 'function'
        ? (this.prisma as any).returnRequest.count({ where: { status: 'REQUESTED' } })
        : Promise.resolve(0),
      typeof (this.prisma as any).inventoryLocation?.findMany === 'function'
        ? (this.prisma as any).inventoryLocation.findMany({
            include: {
              items: {
                select: {
                  variantId: true,
                  quantityAvailable: true,
                  quantityReserved: true,
                  quantityDamaged: true,
                  reorderPoint: true,
                },
              },
            },
            orderBy: { binCode: 'asc' },
          })
        : Promise.resolve([]),
      typeof (this.prisma as any).activityLog?.findMany === 'function'
        ? (this.prisma as any).activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 12,
          })
        : Promise.resolve([]),
    ]);

    const pendingRestockRequestsCount = hasProductEditReq
      ? (pendingStockEditRows || []).filter(
          (r: any) =>
            r?.requestedChanges?.kind === 'STOCK_MANAGE' &&
            (r?.requestedChanges?.operationType === 'RESTOCK' ||
              r?.requestedChanges?.operationType === 'ADJUST' ||
              !r?.requestedChanges?.operationType),
        ).length
      : legacyRestockCount;

    const pendingReturnRequestsCount = hasProductEditReq
      ? (pendingStockEditRows || []).filter(
          (r: any) =>
            r?.requestedChanges?.kind === 'STOCK_MANAGE' &&
            r?.requestedChanges?.operationType === 'RETURN',
        ).length
      : legacyReturnCount;

    return {
      orders,
      pendingMerchantsCount,
      pendingProductApprovalsCount,
      pendingRestockRequestsCount,
      pendingPayouts,
      pendingReturnRequestsCount,
      inventoryLocations,
      recentActivityLogs,
    };
  }
}
