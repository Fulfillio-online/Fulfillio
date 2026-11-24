import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { InventoryRepository } from './inventory.repository';

interface HarnessOptions {
  status?: string;
  lifecycleStatus?: string;
  variants?: Array<Record<string, any>>;
  withAllColors?: boolean;
}

function createManageStockHarness(opts: HarnessOptions = {}) {
  let seq = 1;

  const store = {
    merchant: {
      id: 'merch-1',
      merchantCode: 'MC-101',
      businessName: 'Test Store',
    },
    product: {
      id: 'prod-1',
      merchantId: 'merch-1',
      baseSku: 'TSHIRT01',
      title: 'Classic Cotton Tee',
      description: 'Soft cotton tee',
      category: 'Fashion',
      brand: 'FulfillioWear',
      purchasePrice: 350,
      sellingPrice: 750,
      imageUrl: 'https://cdn.example.com/tee-red.jpg',
      images: ['https://cdn.example.com/tee-red.jpg'],
      status: opts.status ?? 'STOCK_STORED',
      lifecycleStatus: opts.lifecycleStatus ?? 'ACTIVE',
      editState: 'NONE',
      isSuspended: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
    locations: [
      {
        id: 'loc-1',
        zone: 'A',
        aisle: '01',
        rack: '01',
        shelf: '01',
        binCode: 'A-01-01',
      },
    ],
    variants:
      opts.variants ??
      [
        {
          id: 'var-1',
          productId: 'prod-1',
          sku: 'MC-101-TSHIRT01-RED-M',
          barcode: '8940000000001',
          title: 'Red / M',
          price: 750,
          wholesalePrice: 350,
          defaultBinCode: opts.status === 'DRAFT' || opts.status === 'PENDING_APPROVAL' ? 'Pending Approval' : 'A-01-02',
          imageUrl: 'https://cdn.example.com/tee-red.jpg',
          createdAt: new Date('2026-01-01T00:00:01Z'),
          attributes: {
            color: 'Red',
            size: 'M',
            hex: '#ef4444',
            declaredStock: 12,
            stock: 12,
            ...(opts.withAllColors === false
              ? {}
              : { allColors: [{ id: 'c-red', name: 'Red', hex: '#ef4444', sizes: ['M'] }] }),
          } as Record<string, any>,
          inventoryItems: [
            {
              id: 'inv-1',
              variantId: 'var-1',
              locationId: 'loc-1',
              quantityAvailable:
                opts.status === 'DRAFT' || opts.status === 'PENDING_APPROVAL' ? 0 : 12,
              quantityReserved: 0,
              quantityDamaged: 0,
            },
          ],
        },
      ],
    auditLogs: [] as Array<Record<string, any>>,
  };

  const matchProductWhere = (where?: any): boolean => {
    if (!where) return true;
    if (where.OR && Array.isArray(where.OR)) {
      return where.OR.some((clause: any) => matchProductWhere(clause));
    }
    if (where.AND && Array.isArray(where.AND)) {
      return where.AND.every((clause: any) => matchProductWhere(clause));
    }
    if (where.id && where.id !== store.product.id) return false;
    if (where.baseSku && where.baseSku !== store.product.baseSku) return false;
    if (where.merchantId && where.merchantId !== store.product.merchantId) return false;
    if (where.merchant?.merchantCode && where.merchant.merchantCode !== store.merchant.merchantCode) {
      return false;
    }
    return true;
  };

  const hydrateProduct = (include?: any) => {
    const hydratedVariants = [...store.variants]
      .filter((v) => v.productId === store.product.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((v) => ({
        ...v,
        attributes: { ...v.attributes },
        inventoryItems: (v.inventoryItems || []).map((it: any) => ({ ...it })),
      }));

    return {
      ...store.product,
      ...(include?.merchant ? { merchant: { ...store.merchant } } : {}),
      variants: hydratedVariants,
    };
  };

  const tx: any = {
    product: {
      findUnique: async ({ where, include }: any) =>
        matchProductWhere(where) ? hydrateProduct(include) : null,
      findFirst: async ({ where, include }: any) =>
        matchProductWhere(where) ? hydrateProduct(include) : null,
      update: async ({ where, data }: any) => {
        if (where.id !== store.product.id) {
          throw new Error(`Unknown product id ${where.id}`);
        }
        Object.assign(store.product, data);
        return hydrateProduct();
      },
    },
    inventoryLocation: {
      upsert: async ({ where, create }: any) => {
        const found = store.locations.find((l) => l.binCode === where.binCode);
        if (found) return { ...found };
        const created = { id: `loc-${++seq}`, ...create };
        store.locations.push(created);
        return { ...created };
      },
    },
    productVariant: {
      findMany: async ({ where, include }: any) =>
        store.variants
          .filter((v) => !where?.productId || v.productId === where.productId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((v) => ({
            ...v,
            attributes: { ...v.attributes },
            ...(include?.inventoryItems
              ? { inventoryItems: (v.inventoryItems || []).map((it: any) => ({ ...it })) }
              : {}),
          })),
      update: async ({ where, data }: any) => {
        const idx = store.variants.findIndex((v) => v.id === where.id);
        if (idx === -1) throw new Error(`Variant ${where.id} not found`);
        store.variants[idx] = {
          ...store.variants[idx],
          ...data,
          attributes: data.attributes ?? store.variants[idx].attributes,
        };
        return { ...store.variants[idx] };
      },
      create: async ({ data }: any) => {
        const variantId = `var-${++seq}`;
        const created = {
          id: variantId,
          productId: data.productId,
          sku: data.sku,
          barcode: data.barcode,
          title: data.title,
          price: data.price,
          wholesalePrice: data.wholesalePrice,
          defaultBinCode: data.defaultBinCode,
          imageUrl: data.imageUrl,
          createdAt: new Date(Date.now() + seq),
          attributes: data.attributes || {},
          inventoryItems: [],
        };
        store.variants.push(created);
        return { ...created };
      },
    },
    inventoryItem: {
      create: async ({ data }: any) => {
        const variant = store.variants.find((v) => v.id === data.variantId);
        if (!variant) throw new Error(`Variant ${data.variantId} not found`);
        const item = { id: `inv-${++seq}`, ...data };
        variant.inventoryItems.push(item);
        return { ...item };
      },
      upsert: async ({ where, update, create }: any) => {
        const variantId = where.variantId_locationId.variantId;
        const locationId = where.variantId_locationId.locationId;
        const variant = store.variants.find((v) => v.id === variantId);
        if (!variant) throw new Error(`Variant ${variantId} not found`);
        const idx = variant.inventoryItems.findIndex(
          (it: any) => it.variantId === variantId && it.locationId === locationId,
        );
        if (idx >= 0) {
          variant.inventoryItems[idx] = { ...variant.inventoryItems[idx], ...update };
          return { ...variant.inventoryItems[idx] };
        }
        const created = { id: `inv-${++seq}`, ...create };
        variant.inventoryItems.push(created);
        return { ...created };
      },
    },
    inventoryAuditLog: {
      create: async ({ data }: any) => {
        const entry = { id: `audit-${++seq}`, createdAt: new Date(), ...data };
        store.auditLogs.push(entry);
        return entry;
      },
    },
  };

  const prisma: any = {
    ...tx,
    $transaction: async (cb: (client: any) => Promise<any>) => cb(tx),
  };

  const repo = new InventoryRepository(prisma);
  return { repo, store };
}

describe('InventoryRepository.manageProductStock', () => {
  it('adds a new color with multiple sizes & distinct quantities, creates 2-part SKUs, and initializes allColors', async () => {
    const { repo, store } = createManageStockHarness({ withAllColors: false });

    const result: any = await repo.manageProductStock('prod-1', 'MC-101', {
      newVariants: [
        { color: 'Navy Blue', hex: '#1e3a8a', size: 'S', stock: 10 },
        { color: 'Navy Blue', hex: '#1e3a8a', size: 'L', stock: 25 },
      ],
      adjustments: [],
    });

    assert.equal(store.variants.length, 3);
    const navyS = store.variants.find((v) => v.sku === 'MC-101-TSHIRT01-NAVY-BLUE-S');
    const navyL = store.variants.find((v) => v.sku === 'MC-101-TSHIRT01-NAVY-BLUE-L');
    assert.ok(navyS);
    assert.ok(navyL);
    assert.equal(navyS.inventoryItems[0].quantityAvailable, 10);
    assert.equal(navyL.inventoryItems[0].quantityAvailable, 25);
    assert.equal(navyS.attributes.declaredStock, 10);
    assert.equal(navyL.attributes.declaredStock, 25);

    const allColors = store.variants[0].attributes.allColors;
    assert.ok(Array.isArray(allColors));
    assert.deepEqual(
      allColors.map((c: any) => c.name),
      ['Red', 'Navy Blue'],
    );
    assert.deepEqual(
      allColors.find((c: any) => c.name === 'Navy Blue')?.sizes,
      ['S', 'L'],
    );
    assert.deepEqual(store.variants[0].attributes.sizes, ['M', 'S', 'L']);
    assert.equal(store.auditLogs.length, 2);
    assert.equal(result.variants.length, 3);
  });

  it('adjusts existing variant quantities, logs deltas, and promotes APPROVED -> STOCK_STORED when physical stock > 0', async () => {
    const { repo, store } = createManageStockHarness({
      status: 'APPROVED',
      lifecycleStatus: 'AWAITING_STOCK',
      variants: [
        {
          id: 'var-1',
          productId: 'prod-1',
          sku: 'MC-101-TSHIRT01-RED-M',
          barcode: '8940000000001',
          title: 'Red / M',
          price: 750,
          wholesalePrice: 350,
          defaultBinCode: 'A-01-02',
          imageUrl: 'https://cdn.example.com/tee-red.jpg',
          createdAt: new Date('2026-01-01T00:00:01Z'),
          attributes: {
            color: 'Red',
            size: 'M',
            hex: '#ef4444',
            declaredStock: 0,
            stock: 0,
          },
          inventoryItems: [
            {
              id: 'inv-1',
              variantId: 'var-1',
              locationId: 'loc-1',
              quantityAvailable: 0,
              quantityReserved: 0,
              quantityDamaged: 0,
            },
          ],
        },
      ],
    });

    await repo.manageProductStock('MC-101-TSHIRT01', 'MC-101', {
      adjustments: [
        {
          variantId: 'var-1',
          newQuantity: 30,
          reason: 'Added stock for Red / M',
        },
      ],
      newVariants: [{ color: 'Red', hex: '#ef4444', size: 'XL', stock: 15 }],
    });

    assert.equal(store.variants[0].inventoryItems[0].quantityAvailable, 30);
    assert.equal(store.variants[0].attributes.declaredStock, 30);
    assert.equal(store.variants[1].inventoryItems[0].quantityAvailable, 15);
    assert.equal(store.product.status, 'STOCK_STORED');
    assert.equal(store.product.lifecycleStatus, 'ACTIVE');
    assert.equal(store.auditLogs[0].quantityDelta, 30);
    assert.equal(store.auditLogs[1].quantityDelta, 15);
  });

  it('stores declaredStock on newly uploaded PENDING_APPROVAL products while keeping physical quantityAvailable = 0 until intake', async () => {
    const { repo, store } = createManageStockHarness({
      status: 'PENDING_APPROVAL',
      lifecycleStatus: 'PENDING_APPROVAL',
    });

    await repo.manageProductStock('prod-1', 'MC-101', {
      adjustments: [{ variantId: 'var-1', newQuantity: 22 }],
      newVariants: [{ color: 'Red', hex: '#ef4444', size: 'L', stock: 18 }],
    });

    assert.equal(store.variants[0].attributes.declaredStock, 22);
    assert.equal(store.variants[0].inventoryItems[0].quantityAvailable, 0);
    const addedVar = store.variants[1];
    assert.equal(addedVar.sku, 'MC-101-TSHIRT01-RED-L');
    assert.equal(addedVar.attributes.declaredStock, 18);
    assert.equal(addedVar.inventoryItems[0].quantityAvailable, 0);
    assert.equal(store.product.status, 'PENDING_APPROVAL');
  });

  it('creates a default Standard variant when adjusting a zero-variant product', async () => {
    const { repo, store } = createManageStockHarness({
      status: 'DRAFT',
      lifecycleStatus: 'DRAFT',
      variants: [],
    });

    await repo.manageProductStock('prod-1', 'MC-101', {
      adjustments: [{ newQuantity: 45, reason: 'Initial draft stock count' }],
      newVariants: [],
    });

    assert.equal(store.variants.length, 1);
    assert.equal(store.variants[0].sku, 'MC-101-TSHIRT01-STD');
    assert.equal(store.variants[0].attributes.declaredStock, 45);
    assert.equal(store.variants[0].inventoryItems[0].quantityAvailable, 0);
  });
});
