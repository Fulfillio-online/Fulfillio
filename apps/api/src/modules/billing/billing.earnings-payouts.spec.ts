import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

function createBillingTestHarness() {
  const merchants: Array<Record<string, any>> = [
    {
      id: 'm-uuid-101',
      merchantCode: 'MC-101',
      businessName: "Sabbir's Store",
      ownerName: 'Sabbir Ahmed',
      email: 'sabbir@sabbirstore.com',
      phone: '01711-223344',
      baseHandlingFee: 45,
      monthlyStorageFee: 2200,
      returnWindowDays: 3,
      minPayoutAmount: 100,
      payoutAccount: {
        provider: 'bKash Personal',
        accountHolder: 'Sabbir Ahmed',
        accountNumber: '01711223344',
        bkashMerchantNumber: '01711223344',
        frequency: 'Weekly (Every Friday)',
        status: 'VERIFIED',
      },
      createdAt: new Date('2026-10-01T10:00:00Z'),
    },
  ];

  const orders: Array<Record<string, any>> = [];
  const orderEarnings: Array<Record<string, any>> = [];
  const payoutRequests: Array<Record<string, any>> = [];
  const settlements: Array<Record<string, any>> = [];
  const activityLogs: Array<Record<string, any>> = [];
  const notifications: Array<Record<string, any>> = [];
  let seq = 1;

  const matchesOr = (row: any, conds: any[]): boolean => {
    return conds.some((c) => {
      if (c.id && row.id === c.id) return true;
      if (c.externalOrderId && row.externalOrderId === c.externalOrderId) return true;
      if (c.requestCode && String(row.requestCode).toUpperCase() === String(c.requestCode).toUpperCase()) return true;
      if (c.merchantCode?.equals && String(row.merchantCode).toUpperCase() === String(c.merchantCode.equals).toUpperCase()) return true;
      if (c.email && String(row.email).toLowerCase() === String(c.email).toLowerCase()) return true;
      return false;
    });
  };

  const matchSimpleWhere = (row: any, where: any): boolean => {
    if (!where) return true;
    for (const [k, v] of Object.entries(where)) {
      if (k === 'OR' && Array.isArray(v)) {
        if (!matchesOr(row, v)) return false;
        continue;
      }
      if (k === 'earning' && (v as any)?.is === null) {
        if (orderEarnings.some((e) => e.orderId === row.id)) return false;
        continue;
      }
      if (k === 'order' && v && typeof v === 'object') {
        const linkedOrder = orders.find((o) => o.id === row.orderId);
        if (!linkedOrder || !matchSimpleWhere(linkedOrder, v)) return false;
        continue;
      }
      if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        const val = row[k];
        if ('in' in v && Array.isArray((v as any).in)) {
          if (!(v as any).in.includes(val)) return false;
        }
        if ('lte' in v) {
          if (new Date(val).getTime() > new Date((v as any).lte).getTime()) return false;
        }
        if ('equals' in v) {
          if (String(val).toUpperCase() !== String((v as any).equals).toUpperCase()) return false;
        }
        continue;
      }
      if (row[k] !== v) return false;
    }
    return true;
  };

  const attachOrderRelations = (o: any, include?: any) => {
    if (!o) return null;
    const copy: any = { ...o };
    if (include?.merchant) copy.merchant = merchants.find((m) => m.id === o.merchantId) || null;
    if (include?.items) copy.items = o.items || [];
    if (include?.earning) copy.earning = orderEarnings.find((e) => e.orderId === o.id) || null;
    return copy;
  };

  const attachEarningRelations = (e: any, include?: any) => {
    if (!e) return null;
    const copy: any = { ...e };
    if (include?.merchant) copy.merchant = merchants.find((m) => m.id === e.merchantId) || null;
    if (include?.order) {
      const ord = orders.find((o) => o.id === e.orderId);
      if (include.order.include) {
        copy.order = attachOrderRelations(ord, include.order.include);
      } else {
        copy.order = ord ? { ...ord } : null;
      }
    }
    return copy;
  };

  const attachPayoutRelations = (r: any, include?: any) => {
    if (!r) return null;
    const copy: any = { ...r };
    if (include?.merchant) copy.merchant = merchants.find((m) => m.id === r.merchantId) || null;
    return copy;
  };

  const mockPrisma: any = {
    $transaction: async (fn: (tx: any) => Promise<any>) => fn(mockPrisma),
    merchant: {
      findFirst: async ({ where }: any = {}) => {
        if (!where) return merchants[0] || null;
        return merchants.find((m) => matchSimpleWhere(m, where)) || null;
      },
      findUnique: async ({ where }: any) =>
        merchants.find((m) => m.id === where.id || m.merchantCode === where.merchantCode) || null,
      findMany: async ({ where }: any = {}) =>
        merchants.filter((m) => matchSimpleWhere(m, where)),
      update: async ({ where, data }: any) => {
        const idx = merchants.findIndex((m) => m.id === where.id);
        if (idx < 0) throw new Error('Merchant not found');
        merchants[idx] = { ...merchants[idx], ...data, updatedAt: new Date() };
        return merchants[idx];
      },
    },
    order: {
      findFirst: async ({ where, include }: any) => {
        const found = orders.find((o) => matchSimpleWhere(o, where));
        return attachOrderRelations(found, include);
      },
      findMany: async ({ where, include }: any) =>
        orders
          .filter((o) => matchSimpleWhere(o, where))
          .map((o) => attachOrderRelations(o, include)),
      count: async ({ where }: any) =>
        orders.filter((o) => matchSimpleWhere(o, where)).length,
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (let i = 0; i < orders.length; i++) {
          if (matchSimpleWhere(orders[i], where)) {
            orders[i] = { ...orders[i], ...data, updatedAt: new Date() };
            count++;
          }
        }
        return { count };
      },
    },
    orderEarning: {
      findUnique: async ({ where, include }: any) => {
        const found = orderEarnings.find((e) => e.id === where.id || e.orderId === where.orderId);
        return attachEarningRelations(found, include);
      },
      findMany: async ({ where, include }: any = {}) =>
        orderEarnings
          .filter((e) => matchSimpleWhere(e, where))
          .map((e) => attachEarningRelations(e, include)),
      upsert: async ({ where, update, create }: any) => {
        const idx = orderEarnings.findIndex((e) => e.orderId === where.orderId);
        if (idx >= 0) {
          orderEarnings[idx] = { ...orderEarnings[idx], ...update, updatedAt: new Date() };
          return orderEarnings[idx];
        }
        const row = {
          id: `earn-${seq++}`,
          releasedByAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...create,
        };
        orderEarnings.push(row);
        return row;
      },
      update: async ({ where, data, include }: any) => {
        const idx = orderEarnings.findIndex((e) => e.id === where.id);
        if (idx < 0) throw new Error('OrderEarning not found');
        orderEarnings[idx] = { ...orderEarnings[idx], ...data, updatedAt: new Date() };
        return attachEarningRelations(orderEarnings[idx], include);
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (let i = 0; i < orderEarnings.length; i++) {
          if (matchSimpleWhere(orderEarnings[i], where)) {
            orderEarnings[i] = { ...orderEarnings[i], ...data, updatedAt: new Date() };
            count++;
          }
        }
        return { count };
      },
      deleteMany: async ({ where }: any) => {
        const before = orderEarnings.length;
        for (let i = orderEarnings.length - 1; i >= 0; i--) {
          if (matchSimpleWhere(orderEarnings[i], where)) {
            orderEarnings.splice(i, 1);
          }
        }
        return { count: before - orderEarnings.length };
      },
    },
    payoutRequest: {
      findFirst: async ({ where, include }: any) => {
        const found = payoutRequests.find((r) => matchSimpleWhere(r, where));
        return attachPayoutRelations(found, include);
      },
      findMany: async ({ where, include }: any = {}) =>
        payoutRequests
          .filter((r) => matchSimpleWhere(r, where))
          .map((r) => attachPayoutRelations(r, include)),
      create: async ({ data, include }: any) => {
        const row = {
          id: `pr-${seq++}`,
          requestedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        payoutRequests.unshift(row);
        return attachPayoutRelations(row, include);
      },
      update: async ({ where, data, include }: any) => {
        const idx = payoutRequests.findIndex((r) => r.id === where.id);
        if (idx < 0) throw new Error('PayoutRequest not found');
        payoutRequests[idx] = { ...payoutRequests[idx], ...data, updatedAt: new Date() };
        return attachPayoutRelations(payoutRequests[idx], include);
      },
      deleteMany: async ({ where }: any) => {
        const before = payoutRequests.length;
        for (let i = payoutRequests.length - 1; i >= 0; i--) {
          if (matchSimpleWhere(payoutRequests[i], where)) {
            payoutRequests.splice(i, 1);
          }
        }
        return { count: before - payoutRequests.length };
      },
    },
    settlement: {
      findMany: async ({ where }: any = {}) =>
        settlements
          .filter((s) => matchSimpleWhere(s, where))
          .map((s) => ({
            ...s,
            merchant: merchants.find((m) => m.id === s.merchantId),
            payoutRequest: payoutRequests.find((r) => r.id === s.payoutRequestId) || null,
          })),
      create: async ({ data }: any) => {
        const row = { id: `set-${seq++}`, createdAt: new Date(), ...data };
        settlements.unshift(row);
        return row;
      },
      deleteMany: async ({ where }: any) => {
        const before = settlements.length;
        for (let i = settlements.length - 1; i >= 0; i--) {
          if (matchSimpleWhere(settlements[i], where)) {
            settlements.splice(i, 1);
          }
        }
        return { count: before - settlements.length };
      },
    },
    activityLog: {
      create: async ({ data }: any) => {
        const row = { id: `act-${seq++}`, createdAt: new Date(), ...data };
        activityLogs.push(row);
        return row;
      },
    },
    inAppNotification: {
      create: async ({ data }: any) => {
        const row = { id: `notif-${seq++}`, createdAt: new Date(), isRead: false, ...data };
        notifications.push(row);
        return row;
      },
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
    activityLogs,
    notifications,
    service,
    controller,
  };
}

describe('Dynamic Merchant Earnings, Return Window, Claim Stage & Digital-Proof Payouts', () => {
  it('1. puts completed order bill into PENDING for returnWindowDays with accurate fee & net math', async () => {
    const { orders, service } = createBillingTestHarness();
    const now = new Date();
    orders.push({
      id: 'ORD-2001',
      merchantId: 'm-uuid-101',
      externalOrderId: 'ORD-2001',
      customerName: 'Rakib Hasan',
      status: 'DELIVERED',
      totalAmount: 1910,
      codAmount: 1910,
      deliveryFee: 60,
      packagingCost: 5,
      deliveredAt: now,
      updatedAt: now,
      items: [{ productTitle: 'Heavyweight Hoodie', variantLabel: 'Black / XL', quantity: 2, unitPrice: 925 }],
    });

    const dashboard = await service.getMerchantEarningsDashboard('MC-101');

    assert.equal(dashboard.earnings.length, 1);
    const e = dashboard.earnings[0];
    // Gross = 1910, Fees = 60 (delivery) + 45 (merchant baseHandlingFee) + 5 (packaging) = 110 -> Net = 1800
    assert.equal(e.grossAmount, 1910);
    assert.equal(e.deliveryFee, 60);
    assert.equal(e.handlingFee, 45);
    assert.equal(e.packagingFee, 5);
    assert.equal(e.feeAmount, 110);
    assert.equal(e.netAmount, 1800);
    assert.equal(e.status, 'PENDING');
    assert.equal(e.isReturnWindowOver, false);
    assert.equal(dashboard.summary.pendingEarnings, 1800);
    assert.equal(dashboard.summary.readyToClaim, 0);
    assert.equal(dashboard.summary.availableBalance, 0);
  });

  it('2. reverses PENDING earning to REFUNDED when customer returns product', async () => {
    const { orders, service } = createBillingTestHarness();
    const now = new Date();
    orders.push({
      id: 'ORD-2002',
      merchantId: 'm-uuid-101',
      externalOrderId: 'ORD-2002',
      customerName: 'Nadia Islam',
      status: 'DELIVERED',
      totalAmount: 1500,
      codAmount: 1500,
      deliveryFee: 60,
      packagingCost: 5,
      deliveredAt: now,
      updatedAt: now,
      items: [{ productTitle: 'Denim Jacket', quantity: 1, unitPrice: 1440 }],
    });

    await service.recordCompletedOrderEarning('ORD-2002');
    let dash = await service.getMerchantEarningsDashboard('MC-101');
    assert.equal(dash.summary.pendingEarnings, 1390);

    // Customer returns the product
    orders[0].status = 'RETURNED';
    orders[0].returnedAt = new Date();
    await service.reverseOrderEarning('ORD-2002', 'Customer returned damaged fit');

    dash = await service.getMerchantEarningsDashboard('MC-101');
    assert.equal(dash.earnings[0].status, 'REFUNDED');
    assert.equal(dash.summary.pendingEarnings, 0);
    assert.equal(dash.summary.readyToClaim, 0);
    assert.equal(dash.summary.totalRefunded, 1390);

    await assert.rejects(
      () => service.claimEarnings('MC-101', { claimAll: true }),
      BadRequestException,
    );
  });

  it('3. promotes PENDING earnings to READY_TO_CLAIM once return period expires', async () => {
    const { orders, service } = createBillingTestHarness();
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    orders.push({
      id: 'ORD-2003',
      merchantId: 'm-uuid-101',
      externalOrderId: 'ORD-2003',
      customerName: 'Arif Chowdhury',
      status: 'DELIVERED',
      totalAmount: 2110,
      codAmount: 2110,
      deliveryFee: 60,
      packagingCost: 5,
      deliveredAt: fourDaysAgo,
      updatedAt: fourDaysAgo,
      items: [{ productTitle: 'Polo Pack', quantity: 2, unitPrice: 1025 }],
    });

    const dash = await service.getMerchantEarningsDashboard('MC-101');
    assert.equal(dash.earnings[0].status, 'READY_TO_CLAIM');
    assert.equal(dash.earnings[0].isReturnWindowOver, true);
    assert.equal(dash.summary.readyToClaim, 2000);
    assert.equal(dash.summary.withdrawableTotal, 2000);
  });

  it('4. supports admin early release of PENDING earning to READY_TO_CLAIM', async () => {
    const { orders, service } = createBillingTestHarness();
    const now = new Date();
    orders.push({
      id: 'ORD-2004',
      merchantId: 'm-uuid-101',
      externalOrderId: 'ORD-2004',
      customerName: 'Farhana Akter',
      status: 'DELIVERED',
      totalAmount: 1110,
      codAmount: 1110,
      deliveryFee: 60,
      packagingCost: 5,
      deliveredAt: now,
      updatedAt: now,
      items: [{ productTitle: 'Cotton Kurti', quantity: 1, unitPrice: 1050 }],
    });

    const initialDash = await service.getMerchantEarningsDashboard('MC-101');
    const pendingId = initialDash.earnings[0].id;
    assert.equal(initialDash.earnings[0].status, 'PENDING');

    const released = await service.releaseOrderEarningEarly(pendingId, 'admin-1');
    assert.equal(released.status, 'READY_TO_CLAIM');
    assert.equal(released.releasedByAdmin, true);
  });

  it('5. claims READY_TO_CLAIM earnings into wallet and allows withdrawal from wallet or claim stage', async () => {
    const { orders, service } = createBillingTestHarness();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    orders.push(
      {
        id: 'ORD-3001',
        merchantId: 'm-uuid-101',
        externalOrderId: 'ORD-3001',
        customerName: 'Kamal Uddin',
        status: 'DELIVERED',
        totalAmount: 2110,
        codAmount: 2110,
        deliveryFee: 60,
        packagingCost: 5,
        deliveredAt: fiveDaysAgo,
        updatedAt: fiveDaysAgo,
        items: [{ productTitle: 'Item A', quantity: 1, unitPrice: 2050 }],
      },
      {
        id: 'ORD-3002',
        merchantId: 'm-uuid-101',
        externalOrderId: 'ORD-3002',
        customerName: 'Jamal Uddin',
        status: 'DELIVERED',
        totalAmount: 1610,
        codAmount: 1610,
        deliveryFee: 60,
        packagingCost: 5,
        deliveredAt: fiveDaysAgo,
        updatedAt: fiveDaysAgo,
        items: [{ productTitle: 'Item B', quantity: 1, unitPrice: 1550 }],
      },
    );

    // First claim only ORD-3001 (net 2000) into Wallet
    const dashBefore = await service.getMerchantEarningsDashboard('MC-101');
    const firstEarning = dashBefore.earnings.find((e) => e.orderNumber === 'ORD-3001')!;
    const claimRes = await service.claimEarnings('MC-101', { earningIds: [firstEarning.id] });
    assert.equal(claimRes.claimedAmount, 2000);
    assert.equal(claimRes.summary.availableBalance, 2000);
    assert.equal(claimRes.summary.readyToClaim, 1500);
    assert.equal(claimRes.summary.withdrawableTotal, 3500);

    // Request withdrawal of 2800 (uses 2000 wallet + auto-claims 1500 readyToClaim)
    const payout = await service.createPayoutRequest('MC-101', {
      amount: 2800,
      method: 'BKASH',
      provider: 'bKash Personal',
      accountNumber: '01711223344',
      accountHolder: 'Sabbir Ahmed',
    });
    assert.equal(payout.amount, 2800);
    assert.equal(payout.status, 'PENDING');

    const dashAfter = await service.getMerchantEarningsDashboard('MC-101');
    assert.equal(dashAfter.summary.readyToClaim, 0);
    assert.equal(dashAfter.summary.availableBalance, 700);
    assert.equal(dashAfter.summary.upcomingPayout, 2800);

    // Exceeding withdrawableTotal throws BadRequestException
    await assert.rejects(
      () =>
        service.createPayoutRequest('MC-101', {
          amount: 800,
          method: 'BKASH',
          provider: 'bKash Personal',
          accountNumber: '01711223344',
        }),
      BadRequestException,
    );
  });

  it('6. restores wallet balance when merchant cancels PENDING request or admin rejects it', async () => {
    const { orders, service } = createBillingTestHarness();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    orders.push({
      id: 'ORD-4001',
      merchantId: 'm-uuid-101',
      externalOrderId: 'ORD-4001',
      customerName: 'Tareq Ziaur',
      status: 'DELIVERED',
      totalAmount: 3110,
      codAmount: 3110,
      deliveryFee: 60,
      packagingCost: 5,
      deliveredAt: fiveDaysAgo,
      updatedAt: fiveDaysAgo,
      items: [{ productTitle: 'Jacket', quantity: 1, unitPrice: 3050 }],
    });

    const req1 = await service.createPayoutRequest('MC-101', {
      amount: 1000,
      method: 'NAGAD',
      provider: 'Nagad',
      accountNumber: '01811223344',
    });
    await service.cancelPayoutRequest(req1.id, 'MC-101');

    let dash = await service.getMerchantEarningsDashboard('MC-101');
    assert.equal(dash.summary.availableBalance, 3000);
    assert.equal(dash.payoutRequests[0].status, 'CANCELLED');

    const req2 = await service.createPayoutRequest('MC-101', {
      amount: 1200,
      method: 'BANK_TRANSFER',
      provider: 'BRAC Bank PLC',
      accountNumber: '150120489201',
    });
    await service.acceptPayoutRequest(req2.id, 'admin-1');
    await service.rejectPayoutRequest(req2.id, 'Bank account mismatch', 'admin-1');

    dash = await service.getMerchantEarningsDashboard('MC-101');
    assert.equal(dash.summary.availableBalance, 3000);
    assert.equal(dash.payoutRequests[0].status, 'REJECTED');
    assert.equal(dash.payoutRequests[0].rejectionReason, 'Bank account mismatch');
  });

  it('7. requires BOTH TrxID and Digital Proof receipt to settle payout and generates SHA-256 checksum & Settlement', async () => {
    const { orders, service, controller } = createBillingTestHarness();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    orders.push({
      id: 'ORD-5001',
      merchantId: 'm-uuid-101',
      externalOrderId: 'ORD-5001',
      customerName: 'Sadia Afrin',
      status: 'DELIVERED',
      totalAmount: 2610,
      codAmount: 2610,
      deliveryFee: 60,
      packagingCost: 5,
      deliveredAt: fiveDaysAgo,
      updatedAt: fiveDaysAgo,
      items: [{ productTitle: 'Leather Bag', quantity: 1, unitPrice: 2550 }],
    });

    const pr = await service.createPayoutRequest('MC-101', {
      amount: 2500,
      method: 'BKASH',
      provider: 'bKash Personal',
      accountNumber: '01711223344',
    });
    await service.acceptPayoutRequest(pr.id, 'admin-1');

    // Missing proofDocumentUrl -> rejected
    await assert.rejects(
      () =>
        service.completePayoutRequest(pr.id, {
          trxId: 'BK-99887766',
          proofDocumentUrl: '',
        }),
      BadRequestException,
    );

    // Missing trxId -> rejected
    await assert.rejects(
      () =>
        service.completePayoutRequest(pr.id, {
          trxId: '',
          proofDocumentUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        }),
      BadRequestException,
    );

    // Complete with valid TrxID + Digital Proof image Data URL
    const settled = await controller.completePayoutRequest(
      { user: { id: 'admin-1', name: 'Finance Admin' } },
      pr.id,
      {
        trxId: 'BK-99887766',
        proofDocumentUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        proofDocumentName: 'bkash-receipt.jpg',
        proofDocumentMime: 'image/jpeg',
        proofChannel: 'bKash App Transfer',
        proofNotes: 'Transferred from corporate wallet',
      },
    );

    assert.equal(settled.payoutRequest.status, 'PAID');
    assert.equal(settled.payoutRequest.trxId, 'BK-99887766');
    assert.equal(settled.payoutRequest.proofDocumentName, 'bkash-receipt.jpg');
    assert.ok(settled.payoutRequest.proofChecksum && settled.payoutRequest.proofChecksum.length === 64);

    const settlements = await service.getSettlementHistory('MC-101');
    assert.equal(settlements.length, 1);
    assert.equal(settlements[0].transactionRef, 'BK-99887766');
    assert.equal(settlements[0].proofChecksum, settled.payoutRequest.proofChecksum);
    assert.equal(settlements[0].netPayout, 2500);

    const dash = await service.getMerchantEarningsDashboard('MC-101');
    assert.equal(dash.summary.totalPaidOut, 2500);
    assert.equal(dash.summary.availableBalance, 0);
  });

  it('8. calculates earnings from custom order selling price (even when higher than catalog base price)', async () => {
    const { orders, service } = createBillingTestHarness();
    const now = new Date();
    orders.push({
      id: 'ORD-CUSTOM-6001',
      merchantId: 'm-uuid-101',
      externalOrderId: 'ORD-CUSTOM-6001',
      customerName: 'Nafis Chowdhury',
      status: 'DELIVERED',
      // Simulate stale/declared totalAmount (800*2 + 60 = 1660) vs actual order item selling price (1350*2 + 60 - 100 = 2660)
      totalAmount: 1660,
      codAmount: 1660,
      deliveryFee: 60,
      discount: 100,
      packagingCost: 5,
      deliveredAt: now,
      updatedAt: now,
      items: [
        {
          productTitle: 'Heavyweight Fleece Hoodie',
          variantLabel: 'Obsidian Black / XL',
          quantity: 2,
          unitPrice: 1350,
        },
      ],
    });

    await service.recordCompletedOrderEarning('ORD-CUSTOM-6001');
    const dash = await service.getMerchantEarningsDashboard('MC-101');
    assert.equal(dash.earnings.length, 1);

    const e = dash.earnings[0];
    // (1350 * 2) + 60 delivery - 100 discount = 2660 gross; 60 + 45 + 5 = 110 fees; net = 2550
    assert.equal(e.grossAmount, 2660);
    assert.equal(e.feeAmount, 110);
    assert.equal(e.netAmount, 2550);
    assert.ok(e.itemSummary.includes('@৳1,350'));
    assert.equal(dash.summary.pendingEarnings, 2550);
  });
});
