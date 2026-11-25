import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';

function createRecallHarness(initialStock = 20) {
  let variantAvailableStock = initialStock;
  const variant = {
    id: 'var-brown-1',
    productId: 'prod-hat-1',
    sku: 'MC101-HAT-BRN-FREE',
    title: 'Brown / Free Size',
    defaultBinCode: 'A-01-01',
    price: 550,
    wholesalePrice: 400,
    attributes: {
      color: 'Brown',
      hex: '#6B4226',
      size: 'Free Size',
      declaredStock: initialStock,
      stock: initialStock,
    },
    get inventoryItems() {
      return [
        {
          id: 'inv-1',
          variantId: 'var-brown-1',
          locationId: 'loc-1',
          quantityAvailable: variantAvailableStock,
          quantityReserved: 0,
          quantityDamaged: 0,
        },
      ];
    },
  };

  const product: any = {
    id: 'prod-hat-1',
    merchantId: 'm-uuid-101',
    title: 'Classic Cap',
    baseSku: 'HAT-01',
    status: 'STOCK_STORED',
    lifecycleStatus: 'ACTIVE',
    sellingPrice: 550,
    purchasePrice: 400,
    isSuspended: false,
    merchant: {
      id: 'm-uuid-101',
      merchantCode: 'MC-101',
      businessName: "Sabbir's Store",
    },
    variants: [variant],
  };

  const requests = new Map<string, any>();
  const transactions: any[] = [];
  const auditLogs: any[] = [];
  let reqSeq = 1;

  const mockPrisma: any = {
    merchant: {
      findFirst: async () => product.merchant,
    },
    inventoryLocation: {
      upsert: async () => ({ id: 'loc-1', binCode: 'A-01-01' }),
    },
    product: {
      findFirst: async () => product,
      findUnique: async () => product,
      update: async ({ data }: any) => {
        Object.assign(product, data);
        return product;
      },
    },
    productVariant: {
      findMany: async () => [variant],
      update: async ({ data }: any) => {
        if (data?.attributes) {
          variant.attributes = data.attributes;
        }
        return variant;
      },
    },
    inventoryItem: {
      upsert: async ({ update, create }: any) => {
        if (update?.quantityAvailable !== undefined) {
          variantAvailableStock = update.quantityAvailable;
        } else if (create?.quantityAvailable !== undefined) {
          variantAvailableStock = create.quantityAvailable;
        }
        return variant.inventoryItems[0];
      },
      update: async ({ data }: any) => {
        if (data?.quantityAvailable !== undefined) {
          variantAvailableStock = data.quantityAvailable;
        }
        return variant.inventoryItems[0];
      },
    },
    inventoryAuditLog: {
      create: async ({ data }: any) => {
        auditLogs.push(data);
        return data;
      },
    },
    inventoryTransaction: {
      create: async ({ data }: any) => {
        transactions.push(data);
        return data;
      },
    },
    productEditRequest: {
      create: async ({ data }: any) => {
        const record = {
          id: `req-${reqSeq++}`,
          createdAt: new Date(),
          ...data,
          product: {
            id: product.id,
            title: product.title,
            baseSku: product.baseSku,
            imageUrl: '',
            merchant: product.merchant,
          },
        };
        requests.set(record.id, record);
        return record;
      },
      findUnique: async ({ where }: any) => requests.get(where.id) || null,
      update: async ({ where, data }: any) => {
        const existing = requests.get(where.id);
        const updated = { ...existing, ...data };
        requests.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: any) => {
        const existing = requests.get(where.id);
        requests.delete(where.id);
        return existing;
      },
    },
  };

  mockPrisma.$transaction = async (cb: any) => cb(mockPrisma);

  const repo = new InventoryRepository(mockPrisma);
  return {
    repo,
    getStock: () => variantAvailableStock,
    setStock: (next: number) => {
      variantAvailableStock = next;
      variant.attributes.declaredStock = next;
      variant.attributes.stock = next;
    },
    getVariant: () => variant,
    getTransactions: () => transactions,
    getAuditLogs: () => auditLogs,
    getRequest: (id: string) => requests.get(id),
  };
}

describe('InventoryRepository Stock Recall / Return Approval Flow', () => {
  it('submits a PENDING RETURN request without deducting live stock and rejects over-recalls', async () => {
    const h = createRecallHarness(20);

    await assert.rejects(
      () =>
        h.repo.submitStockManageRequest('prod-hat-1', 'MC-101', {
          operationType: 'RETURN',
          requestedQty: 25,
          variantId: 'var-brown-1',
          color: 'Brown',
          size: 'Free Size',
          destination: 'Dhanmondi Branch',
          reason: 'Shop demand',
        }),
      BadRequestException,
    );

    const created = await h.repo.submitStockManageRequest('prod-hat-1', 'MC-101', {
      operationType: 'RETURN',
      requestedQty: 7,
      variantId: 'var-brown-1',
      color: 'Brown',
      size: 'Free Size',
      destination: 'Dhanmondi Branch, Road 27',
      reason: 'Shop / Retail Demand',
    });

    assert.equal(created.status, 'PENDING');
    assert.equal((created.requestedChanges as any).operationType, 'RETURN');
    assert.equal((created.requestedChanges as any).requestedQty, 7);
    assert.equal((created.requestedChanges as any).destination, 'Dhanmondi Branch, Road 27');
    assert.equal((created.requestedChanges as any).adjustments[0].previousQuantity, 20);
    assert.equal((created.requestedChanges as any).adjustments[0].newQuantity, 13);
    // Live warehouse stock remains untouched until Admin approves
    assert.equal(h.getStock(), 20);
  });

  it('approves recall using live warehouse stock at approval time, issues Gate Pass, and logs RETURN_TO_MERCHANT', async () => {
    const h = createRecallHarness(20);

    const created = await h.repo.submitStockManageRequest('prod-hat-1', 'MC-101', {
      operationType: 'RETURN',
      requestedQty: 7,
      variantId: 'var-brown-1',
      color: 'Brown',
      size: 'Free Size',
      destination: 'Dhanmondi Branch',
      reason: 'Seasonal Pullout',
    });

    // Simulate an order reducing live stock from 20 -> 15 before admin approves
    h.setStock(15);

    const result = await h.repo.reviewStockManageRequest(
      created.id,
      'admin-user-1',
      'APPROVE',
    );

    assert.equal(result.request.status, 'APPROVED');
    assert.equal(h.getStock(), 8);
    assert.equal(h.getVariant().attributes.declaredStock, 8);
    assert.match((result.request.requestedChanges as any).gatePassNo, /^GP-\d{4}-\d{4}$/);
    assert.equal((result.request.requestedChanges as any).adjustments[0].previousQuantity, 15);
    assert.equal((result.request.requestedChanges as any).adjustments[0].newQuantity, 8);
    assert.equal(h.getTransactions().length, 1);
    assert.equal(h.getTransactions()[0].transactionType, 'RETURN_TO_MERCHANT');
    assert.equal(h.getTransactions()[0].quantity, 7);
    assert.equal(h.getAuditLogs().length, 1);
    assert.equal(h.getAuditLogs()[0].quantityDelta, -7);
  });

  it('rejects recall approval if live stock dropped below requestedQty and supports REJECT cleanly', async () => {
    const h = createRecallHarness(20);

    const created = await h.repo.submitStockManageRequest('prod-hat-1', 'MC-101', {
      operationType: 'RETURN',
      requestedQty: 10,
      variantId: 'var-brown-1',
      destination: 'Mirpur Outlet',
      reason: 'Outlet Relocation',
    });

    h.setStock(4);

    await assert.rejects(
      () => h.repo.reviewStockManageRequest(created.id, 'admin-1', 'APPROVE'),
      BadRequestException,
    );
    assert.equal(h.getStock(), 4);
    assert.equal(h.getRequest(created.id).status, 'PENDING');

    const rejected = await h.repo.reviewStockManageRequest(
      created.id,
      'admin-1',
      'REJECT',
      'Stock committed to pending orders',
    );
    assert.equal(rejected.request.status, 'REJECTED');
    assert.equal(rejected.request.rejectionReason, 'Stock committed to pending orders');
    assert.equal(h.getStock(), 4);
  });
});
