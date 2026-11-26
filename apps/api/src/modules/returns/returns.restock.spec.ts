import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { StockMovementReason } from '@fulfillio/contracts';
import { ReturnsRepository } from './returns.repository';
import { ReturnsService } from './returns.service';

describe('ReturnsRepository & ReturnsService Reverse Logistics Integrity', () => {
  it('increments ONLY ONE bin row on multi-bin RTO restock and syncs declaredStock', async () => {
    const invItems: Array<Record<string, any>> = [
      {
        id: 'inv-bin-1',
        variantId: 'var-multi',
        quantityAvailable: 10,
        quantityReserved: 0,
        quantityDamaged: 0,
        location: { binCode: 'A-01-01', isDamaged: false },
      },
      {
        id: 'inv-bin-2',
        variantId: 'var-multi',
        quantityAvailable: 5,
        quantityReserved: 0,
        quantityDamaged: 0,
        location: { binCode: 'B-02-01', isDamaged: false },
      },
    ];
    const variantRow: Record<string, any> = {
      id: 'var-multi',
      attributes: { color: 'Black', declaredStock: 15, stock: 15 },
    };
    const auditLogs: Array<Record<string, any>> = [];

    const mockPrisma: any = {
      $transaction: async (fn: (tx: any) => Promise<any>) => fn(mockPrisma),
      inventoryItem: {
        findMany: async ({ where }: any) =>
          invItems.filter((it) => it.variantId === where.variantId),
        update: async ({ where, data }: any) => {
          const item = invItems.find((it) => it.id === where.id)!;
          if (data.quantityAvailable?.increment) {
            item.quantityAvailable += data.quantityAvailable.increment;
          }
          if (data.quantityDamaged?.increment) {
            item.quantityDamaged += data.quantityDamaged.increment;
          }
          return item;
        },
      },
      productVariant: {
        findUnique: async ({ where }: any) =>
          where.id === variantRow.id ? variantRow : null,
        update: async ({ where, data }: any) => {
          if (where.id === variantRow.id) {
            variantRow.attributes = data.attributes;
          }
          return variantRow;
        },
      },
      inventoryAuditLog: {
        create: async ({ data }: any) => {
          const entry = { id: `log-${auditLogs.length + 1}`, ...data };
          auditLogs.push(entry);
          return entry;
        },
      },
    };

    const repo = new ReturnsRepository(mockPrisma);
    await repo.restockOrQuarantineVariant(
      'm-1',
      'ORD-RTO-1',
      'var-multi',
      3,
      true,
      'Customer returned undamaged',
    );

    assert.equal(invItems[0].quantityAvailable, 13);
    assert.equal(invItems[1].quantityAvailable, 5);
    assert.equal(variantRow.attributes.declaredStock, 18);
    assert.equal(variantRow.attributes.stock, 18);
    assert.equal(auditLogs.length, 1);
    assert.equal(auditLogs[0].reason, StockMovementReason.RETURN_RESTOCK);
  });

  it('prevents duplicate RTO stock inflation on repeated processInboundRTO calls', async () => {
    const orders: Array<Record<string, any>> = [
      {
        id: 'ORD-IDEMP-1',
        merchantId: 'm-1',
        status: 'DISPATCHED',
        items: [{ variantId: 'var-1', quantity: 2 }],
      },
    ];
    const auditLogs: Array<Record<string, any>> = [];
    const invItems: Array<Record<string, any>> = [
      {
        id: 'inv-1',
        variantId: 'var-1',
        quantityAvailable: 5,
        quantityReserved: 0,
        quantityDamaged: 0,
        location: { binCode: 'A-01-01', isDamaged: false },
      },
    ];

    const mockPrisma: any = {
      $transaction: async (fn: (tx: any) => Promise<any>) => fn(mockPrisma),
      order: {
        findFirst: async () => orders[0],
        update: async ({ data }: any) => {
          orders[0].status = data.status;
          orders[0].returnedAt = data.returnedAt;
          return orders[0];
        },
      },
      inventoryItem: {
        findMany: async () => invItems,
        update: async ({ where, data }: any) => {
          const it = invItems.find((r) => r.id === where.id)!;
          if (data.quantityAvailable?.increment) {
            it.quantityAvailable += data.quantityAvailable.increment;
          }
          return it;
        },
      },
      productVariant: {
        findUnique: async () => null,
      },
      inventoryAuditLog: {
        findFirst: async ({ where }: any) =>
          auditLogs.find(
            (l) =>
              l.referenceId === where.referenceId &&
              where.reason.in.includes(l.reason),
          ) || null,
        create: async ({ data }: any) => {
          const entry = { id: `log-${auditLogs.length + 1}`, ...data };
          auditLogs.push(entry);
          return entry;
        },
      },
    };

    const repo = new ReturnsRepository(mockPrisma);
    const service = new ReturnsService(repo, { reverseOrderEarning: async () => ({}) } as any);

    await service.processInboundRTO('ORD-IDEMP-1', true, 'RTO #1');
    assert.equal(invItems[0].quantityAvailable, 7);

    // Repeating processInboundRTO on already-RETURNED order must fail cleanly without adding +2 again
    await assert.rejects(
      () => service.processInboundRTO('ORD-IDEMP-1', true, 'RTO duplicate'),
      BadRequestException,
    );
    assert.equal(invItems[0].quantityAvailable, 7);
  });

  it('computes returnRate consistently with Finance Analytics (including PARTIAL_DELIVERED)', async () => {
    const orders = [
      { id: '1', status: 'DELIVERED' },
      { id: '2', status: 'PARTIAL_DELIVERED' },
      { id: '3', status: 'RETURNED' },
      { id: '4', status: 'DISPATCHED' },
    ];

    const mockPrisma: any = {
      order: {
        count: async ({ where }: any) => {
          if (typeof where.status === 'string') {
            return orders.filter((o) => o.status === where.status).length;
          }
          if (where.status?.in) {
            return orders.filter((o) => where.status.in.includes(o.status)).length;
          }
          return orders.length;
        },
      },
      inventoryAuditLog: {
        findMany: async () => [],
      },
    };

    const repo = new ReturnsRepository(mockPrisma);
    const stats = await repo.getReturnAuditStats();

    // 1 RETURNED / (1 DELIVERED + 1 PARTIAL_DELIVERED + 1 RETURNED) = 1/3 = 33.33%
    assert.equal(stats.totalReturnedOrders, 1);
    assert.equal(stats.totalDispatchedOrders, 4);
    assert.equal(stats.returnRate, 33.33);
  });
});
