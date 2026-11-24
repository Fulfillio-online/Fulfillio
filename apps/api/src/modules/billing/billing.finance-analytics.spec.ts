import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FinanceEntryCategory, FinanceEntryType } from '@fulfillio/contracts';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

function createFinanceTestHarness() {
  const merchants: Array<Record<string, any>> = [
    {
      id: 'm-1',
      merchantCode: 'MC-101',
      businessName: 'Dhaka Fashion Hub',
      ownerName: 'Sabbir',
      email: 'dhaka@example.com',
      status: 'APPROVED',
      baseHandlingFee: 50,
      monthlyStorageFee: 2500,
      returnWindowDays: 3,
      minPayoutAmount: 100,
      createdAt: new Date('2026-11-01T10:00:00Z'),
    },
    {
      id: 'm-2',
      merchantCode: 'MC-102',
      businessName: 'Sylhet Gadgets',
      ownerName: 'Tariq',
      email: 'sylhet@example.com',
      status: 'PENDING',
      baseHandlingFee: 40,
      monthlyStorageFee: 1500,
      returnWindowDays: 3,
      minPayoutAmount: 100,
      createdAt: new Date('2026-11-02T10:00:00Z'),
    },
  ];

  const orders: Array<Record<string, any>> = [];
  const orderEarnings: Array<Record<string, any>> = [];
  const payoutRequests: Array<Record<string, any>> = [];
  const settlements: Array<Record<string, any>> = [];
  const financeEntries: Array<Record<string, any>> = [];
  const inventoryLocations: Array<Record<string, any>> = [];
  const activityLogs: Array<Record<string, any>> = [];
  let seq = 1;

  const matchesSimple = (row: any, where: any): boolean => {
    if (!where) return true;
    for (const [k, v] of Object.entries(where)) {
      if (k === 'OR' && Array.isArray(v)) {
        const ok = v.some((cond: any) => {
          if (cond.id && row.id === cond.id) return true;
          if (cond.externalOrderId && row.externalOrderId === cond.externalOrderId) return true;
          if (
            cond.merchantCode?.equals &&
            String(row.merchantCode).toUpperCase() === String(cond.merchantCode.equals).toUpperCase()
          ) {
            return true;
          }
          if (cond.email && String(row.email).toLowerCase() === String(cond.email).toLowerCase()) {
            return true;
          }
          return false;
        });
        if (!ok) return false;
        continue;
      }
      if (k === 'earning' && (v as any)?.is === null) {
        if (orderEarnings.some((e) => e.orderId === row.id)) return false;
        continue;
      }
      if (k === 'order' && v && typeof v === 'object') {
        const ord = orders.find((o) => o.id === row.orderId);
        if (!ord || !matchesSimple(ord, v)) return false;
        continue;
      }
      if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        const val = row[k];
        if ('in' in v && Array.isArray((v as any).in) && !(v as any).in.includes(val)) return false;
        if ('lte' in v && new Date(val).getTime() > new Date((v as any).lte).getTime()) return false;
        continue;
      }
      if (row[k] !== v) return false;
    }
    return true;
  };

  const mockPrisma: any = {
    $transaction: async (fn: (tx: any) => Promise<any>) => fn(mockPrisma),
    merchant: {
      findFirst: async ({ where }: any = {}) =>
        merchants.find((m) => matchesSimple(m, where)) || null,
      findMany: async ({ where }: any = {}) =>
        merchants.filter((m) => matchesSimple(m, where)),
      count: async ({ where }: any = {}) =>
        merchants.filter((m) => matchesSimple(m, where)).length,
    },
    order: {
      findFirst: async ({ where, include }: any) => {
        const found = orders.find((o) => matchesSimple(o, where));
        if (!found) return null;
        return {
          ...found,
          merchant: include?.merchant ? merchants.find((m) => m.id === found.merchantId) : undefined,
          items: found.items || [],
          earning: include?.earning
            ? orderEarnings.find((e) => e.orderId === found.id) || null
            : undefined,
        };
      },
      findMany: async ({ where, include }: any = {}) =>
        orders
          .filter((o) => matchesSimple(o, where))
          .map((o) => ({
            ...o,
            merchant: include?.merchant || true
              ? merchants.find((m) => m.id === o.merchantId) || null
              : undefined,
            items: o.items || [],
          })),
    },
    orderEarning: {
      findMany: async ({ where }: any = {}) =>
        orderEarnings.filter((e) => matchesSimple(e, where)),
      upsert: async ({ where, update, create }: any) => {
        const idx = orderEarnings.findIndex((e) => e.orderId === where.orderId);
        if (idx >= 0) {
          orderEarnings[idx] = { ...orderEarnings[idx], ...update, updatedAt: new Date() };
          return orderEarnings[idx];
        }
        const row = { id: `earn-${seq++}`, createdAt: new Date(), updatedAt: new Date(), ...create };
        orderEarnings.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const idx = orderEarnings.findIndex((e) => e.id === where.id);
        orderEarnings[idx] = { ...orderEarnings[idx], ...data };
        return orderEarnings[idx];
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (let i = 0; i < orderEarnings.length; i++) {
          if (matchesSimple(orderEarnings[i], where)) {
            orderEarnings[i] = { ...orderEarnings[i], ...data };
            count++;
          }
        }
        return { count };
      },
    },
    payoutRequest: {
      findMany: async ({ where }: any = {}) =>
        payoutRequests.filter((r) => matchesSimple(r, where)),
    },
    settlement: {
      findMany: async ({ where }: any = {}) =>
        settlements.filter((s) => matchesSimple(s, where)),
    },
    companyFinanceEntry: {
      findMany: async ({ where }: any = {}) =>
        financeEntries
          .filter((f) => matchesSimple(f, where))
          .map((f) => ({
            ...f,
            merchant: f.merchantId
              ? merchants.find((m) => m.id === f.merchantId) || null
              : null,
          })),
      findUnique: async ({ where }: any) => {
        const found = financeEntries.find((f) => f.id === where.id);
        if (!found) return null;
        return {
          ...found,
          merchant: found.merchantId
            ? merchants.find((m) => m.id === found.merchantId) || null
            : null,
        };
      },
      create: async ({ data }: any) => {
        const row = {
          id: `fin-${seq++}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        financeEntries.push(row);
        return {
          ...row,
          merchant: row.merchantId
            ? merchants.find((m) => m.id === row.merchantId) || null
            : null,
        };
      },
      update: async ({ where, data }: any) => {
        const idx = financeEntries.findIndex((f) => f.id === where.id);
        financeEntries[idx] = { ...financeEntries[idx], ...data, updatedAt: new Date() };
        return {
          ...financeEntries[idx],
          merchant: financeEntries[idx].merchantId
            ? merchants.find((m) => m.id === financeEntries[idx].merchantId) || null
            : null,
        };
      },
      delete: async ({ where }: any) => {
        const idx = financeEntries.findIndex((f) => f.id === where.id);
        const [removed] = financeEntries.splice(idx, 1);
        return removed;
      },
    },
    productApprovalRequest: { count: async () => 2 },
    restockRequest: { count: async () => 1 },
    returnRequest: { count: async () => 3 },
    inventoryLocation: {
      findMany: async () => inventoryLocations,
    },
    activityLog: {
      findMany: async () => activityLogs,
    },
  };

  const repository = new BillingRepository(mockPrisma);
  const service = new BillingService(repository, mockPrisma);
  const controller = new BillingController(service);

  return {
    merchants,
    orders,
    orderEarnings,
    payoutRequests,
    settlements,
    financeEntries,
    inventoryLocations,
    activityLogs,
    service,
    controller,
  };
}

describe('Admin Finance Analytics, Company Ledger CRUD & Operations Dashboard', () => {
  it('1. separates COD settlement pass-through from Fulfillio 3PL P&L accurately (profitable case)', async () => {
    const { orders, payoutRequests, service } = createFinanceTestHarness();
    const now = new Date();

    // Order 1 (MC-101): items 1000 + delivery 60 = 1060 gross, fees = 60 + 50 + 10 = 120, net = 940
    orders.push({
      id: 'ord-1',
      merchantId: 'm-1',
      externalOrderId: 'ORD-1',
      customerName: 'A',
      status: 'DELIVERED',
      courierProvider: 'STEADFAST',
      totalAmount: 1060,
      codAmount: 1060,
      deliveryFee: 60,
      packagingCost: 10,
      items: [{ productTitle: 'Shirt', unitPrice: 1000, quantity: 1 }],
      createdAt: now,
      deliveredAt: now,
      updatedAt: now,
    });

    // Order 2 (MC-102): items 2000 + delivery 100 = 2100 gross, fees = 100 + 40 + 20 = 160, net = 1940
    orders.push({
      id: 'ord-2',
      merchantId: 'm-2',
      externalOrderId: 'ORD-2',
      customerName: 'B',
      status: 'DELIVERED',
      courierProvider: 'PATHAO',
      totalAmount: 2100,
      codAmount: 2100,
      deliveryFee: 100,
      packagingCost: 20,
      items: [{ productTitle: 'Watch', unitPrice: 2000, quantity: 1 }],
      createdAt: now,
      deliveredAt: now,
      updatedAt: now,
    });

    // Pending payout request for MC-101 of 400 (from net 940 -> wait, order is PENDING hold until 3d, still upcoming payout counts)
    payoutRequests.push({
      id: 'pr-1',
      requestCode: 'PR-100',
      merchantId: 'm-1',
      amount: 300,
      status: 'PAID',
      paidAt: now,
      requestedAt: now,
      updatedAt: now,
    });

    // Add manual Storage Fee income (+500) and Rent expense (-200)
    await service.createCompanyFinanceEntry({
      type: FinanceEntryType.INCOME,
      category: FinanceEntryCategory.STORAGE_FEE,
      title: 'Storage Rent MC-101',
      amount: 500,
      merchantId: 'm-1',
      entryDate: now.toISOString(),
    });
    await service.createCompanyFinanceEntry({
      type: FinanceEntryType.EXPENSE,
      category: FinanceEntryCategory.RENT,
      title: 'Warehouse Electricity & Rent',
      amount: 200,
      entryDate: now.toISOString(),
    });

    const analytics = await service.getAdminFinanceAnalytics({ preset: 'THIS_MONTH' });

    // COD Settlement check
    assert.equal(analytics.codSettlement.totalOrderBillCollected, 3160);
    assert.equal(analytics.codSettlement.totalPlatformFeesDeducted, 280); // 120 + 160
    assert.equal(analytics.codSettlement.merchantNetPayable, 2880); // 940 + 1940
    assert.equal(analytics.codSettlement.totalPaidToMerchants, 300);

    // Company 3PL P&L check
    assert.equal(analytics.companyProfitLoss.autoHandlingRevenue, 90); // 50 + 40
    assert.equal(analytics.companyProfitLoss.autoPackagingRevenue, 30); // 10 + 20
    assert.equal(analytics.companyProfitLoss.autoDeliveryFeeRevenue, 160); // 60 + 100
    assert.equal(analytics.companyProfitLoss.autoOrderFeeRevenue, 280);
    assert.equal(analytics.companyProfitLoss.manualStorageIncome, 500);
    assert.equal(analytics.companyProfitLoss.gross3plRevenue, 780); // 280 + 500
    assert.equal(analytics.companyProfitLoss.totalOperatingExpenses, 200);
    assert.equal(analytics.companyProfitLoss.netProfit, 580);
    assert.equal(analytics.companyProfitLoss.isProfitable, true);
  });

  it('2. detects operating deficit (netProfit < 0) and excludes general overhead on single-merchant filter', async () => {
    const { orders, service } = createFinanceTestHarness();
    const now = new Date();

    orders.push({
      id: 'ord-3',
      merchantId: 'm-1',
      externalOrderId: 'ORD-3',
      customerName: 'C',
      status: 'DELIVERED',
      courierProvider: 'REDX',
      totalAmount: 550,
      codAmount: 550,
      deliveryFee: 60,
      packagingCost: 5,
      items: [{ productTitle: 'Cap', unitPrice: 490, quantity: 1 }],
      createdAt: now,
      deliveredAt: now,
      updatedAt: now,
    });

    // General overhead rent (unallocated, merchantId = null) -> 2000
    await service.createCompanyFinanceEntry({
      type: FinanceEntryType.EXPENSE,
      category: FinanceEntryCategory.RENT,
      title: 'Main Warehouse Rent',
      amount: 2000,
      entryDate: now.toISOString(),
    });

    const allAnalytics = await service.getAdminFinanceAnalytics({ preset: 'THIS_MONTH' });
    assert.equal(allAnalytics.companyProfitLoss.isMerchantScoped, false);
    assert.equal(allAnalytics.companyProfitLoss.gross3plRevenue, 115); // 50+5+60
    assert.equal(allAnalytics.companyProfitLoss.totalOperatingExpenses, 2000);
    assert.equal(allAnalytics.companyProfitLoss.netProfit, -1885);
    assert.equal(allAnalytics.companyProfitLoss.isProfitable, false);

    // Filtered to MC-101: unallocated warehouse rent excluded
    const scopedAnalytics = await service.getAdminFinanceAnalytics({
      preset: 'THIS_MONTH',
      merchantIdentifier: 'm-1',
    });
    assert.equal(scopedAnalytics.companyProfitLoss.isMerchantScoped, true);
    assert.equal(scopedAnalytics.companyProfitLoss.totalOperatingExpenses, 0);
    assert.equal(scopedAnalytics.companyProfitLoss.netProfit, 115);
    assert.equal(scopedAnalytics.companyProfitLoss.isProfitable, true);
  });

  it('3. validates finance entry payload and supports create, update, delete', async () => {
    const { service } = createFinanceTestHarness();

    await assert.rejects(
      () =>
        service.createCompanyFinanceEntry({
          type: FinanceEntryType.EXPENSE,
          category: FinanceEntryCategory.STORAGE_FEE,
          title: 'Invalid mix',
          amount: 100,
        }),
      BadRequestException,
    );

    await assert.rejects(
      () =>
        service.createCompanyFinanceEntry({
          type: FinanceEntryType.EXPENSE,
          category: FinanceEntryCategory.SALARY,
          title: 'Staff',
          amount: 0,
        }),
      BadRequestException,
    );

    const created = await service.createCompanyFinanceEntry({
      type: FinanceEntryType.EXPENSE,
      category: FinanceEntryCategory.SALARY,
      title: 'Packer Team Salary',
      amount: 15000,
    });
    assert.equal(created.amount, 15000);
    assert.equal(created.category, FinanceEntryCategory.SALARY);

    const updated = await service.updateCompanyFinanceEntry(created.id, {
      amount: 18000,
      title: 'Packer & Picker Team Salary',
    });
    assert.equal(updated.amount, 18000);
    assert.equal(updated.title, 'Packer & Picker Team Salary');

    const deleted = await service.deleteCompanyFinanceEntry(created.id);
    assert.equal(deleted.deleted, true);

    await assert.rejects(
      () => service.deleteCompanyFinanceEntry(created.id),
      NotFoundException,
    );
  });

  it('4. builds live operations dashboard counts for pipeline, action center, couriers, and zones', async () => {
    const { orders, payoutRequests, inventoryLocations, controller } =
      createFinanceTestHarness();
    const now = new Date();

    orders.push(
      {
        id: 'o-p1',
        merchantId: 'm-1',
        externalOrderId: 'O-1',
        customerName: 'U1',
        status: 'PENDING',
        totalAmount: 500,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'o-pk1',
        merchantId: 'm-1',
        externalOrderId: 'O-2',
        customerName: 'U2',
        status: 'PACKED',
        courierProvider: 'STEADFAST',
        totalAmount: 700,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'o-d1',
        merchantId: 'm-1',
        externalOrderId: 'O-3',
        customerName: 'U3',
        status: 'DISPATCHED',
        courierProvider: 'STEADFAST',
        totalAmount: 900,
        codAmount: 900,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'o-dl1',
        merchantId: 'm-1',
        externalOrderId: 'O-4',
        customerName: 'U4',
        status: 'DELIVERED',
        courierProvider: 'STEADFAST',
        totalAmount: 1200,
        deliveredAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'o-r1',
        merchantId: 'm-1',
        externalOrderId: 'O-5',
        customerName: 'U5',
        status: 'RETURNED',
        courierProvider: 'PATHAO',
        totalAmount: 400,
        createdAt: now,
        updatedAt: now,
      },
    );

    payoutRequests.push({
      id: 'pr-pending',
      merchantId: 'm-1',
      amount: 1250,
      status: 'PENDING',
    });

    inventoryLocations.push({
      id: 'loc-1',
      zone: 'A',
      binCode: 'A-01-01',
      items: [
        {
          variantId: 'var-1',
          quantityAvailable: 40,
          quantityReserved: 5,
          quantityDamaged: 1,
          reorderPoint: 10,
        },
      ],
    });

    const ops = await controller.getAdminOperationsDashboard();

    assert.equal(ops.pipeline.pendingAndProcessingCount, 1);
    assert.equal(ops.pipeline.packedAndReadyCount, 1);
    assert.equal(ops.pipeline.dispatchedInTransitCount, 1);
    assert.equal(ops.pipeline.deliveredTodayCount, 1);
    assert.equal(ops.pipeline.returnedCount, 1);
    assert.equal(ops.pipeline.deliverySuccessRate, 50);

    // 1 pending merchant (MC-102) + 2 product + 1 restock + 1 payout + 3 return = 8
    assert.equal(ops.actionCenter.pendingMerchantsCount, 1);
    assert.equal(ops.actionCenter.pendingPayoutRequestsCount, 1);
    assert.equal(ops.actionCenter.pendingPayoutRequestsAmount, 1250);
    assert.equal(ops.actionCenter.totalActionItems, 8);

    const sf = ops.couriers.find((c) => c.provider === 'STEADFAST');
    assert.ok(sf);
    assert.equal(sf.totalParcels, 3);
    assert.equal(sf.inTransitCount, 1);
    assert.equal(sf.codInTransitAmount, 900);

    assert.equal(ops.warehouseCapacity.totalBins, 1);
    assert.equal(ops.warehouseCapacity.totalAvailableUnits, 40);
    assert.equal(ops.warehouseCapacity.zones[0].zone, 'A');
  });
});
