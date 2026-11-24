import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { InventoryRepository } from './inventory.repository';

function createMockPrismaHarness() {
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
      description: 'Live published cotton tee',
      category: 'Fashion',
      brand: 'FulfillioWear',
      purchasePrice: 350,
      sellingPrice: 750,
      weight: 0.25,
      dimensions: '30x20x4 cm',
      imageUrl: 'https://cdn.example.com/tee-red.jpg',
      images: ['https://cdn.example.com/tee-red.jpg'],
      status: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
      editState: 'NONE',
      isSuspended: false,
      suspendedReason: null as string | null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
    locations: [
      {
        id: 'loc-1',
        zone: 'A',
        aisle: '01',
        rack: '02',
        shelf: '01',
        binCode: 'A-01-02',
      },
    ],
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
          category: 'Fashion',
          sizes: ['M'],
          allColors: [{ id: 'c-red', name: 'Red', hex: '#ef4444' }],
        } as Record<string, any>,
        inventoryItems: [
          {
            id: 'inv-1',
            variantId: 'var-1',
            locationId: 'loc-1',
            quantityAvailable: 40,
            quantityReserved: 0,
            quantityDamaged: 0,
          },
        ],
        orderItems: [] as Array<{ id: string }>,
        inboundItems: [] as Array<{ id: string }>,
      },
    ],
    editRequests: [] as Array<Record<string, any>>,
    notifications: [] as Array<Record<string, any>>,
    activityLogs: [] as Array<Record<string, any>>,
  };

  const hydrateProduct = (include?: any) => {
    const locMap = new Map(store.locations.map((l) => [l.id, { ...l }]));
    const hydratedVariants = [...store.variants]
      .filter((v) => v.productId === store.product.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((v) => ({
        ...v,
        attributes: { ...v.attributes },
        inventoryItems: v.inventoryItems.map((it) => ({
          ...it,
          ...(include?.variants?.include?.inventoryItems?.include?.location
            ? { location: locMap.get(it.locationId) || null }
            : {}),
        })),
        orderItems: [...v.orderItems],
        inboundItems: [...v.inboundItems],
      }));

    let editRequests = store.editRequests
      .filter((r) => r.productId === store.product.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    const editFilter = include?.editRequests?.where;
    if (editFilter?.requestType) {
      editRequests = editRequests.filter(
        (r) => r.requestType === editFilter.requestType,
      );
    }
    if (typeof include?.editRequests?.take === 'number') {
      editRequests = editRequests.slice(0, include.editRequests.take);
    }

    return {
      ...store.product,
      ...(include?.merchant ? { merchant: { ...store.merchant } } : {}),
      variants: hydratedVariants,
      ...(include?.editRequests ? { editRequests } : {}),
    };
  };

  const matchProductWhere = (where?: any) => {
    if (!where) return true;
    if (where.id && where.id !== store.product.id) return false;
    if (where.baseSku && where.baseSku !== store.product.baseSku) return false;
    if (where.merchantId && where.merchantId !== store.product.merchantId) {
      return false;
    }
    return true;
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
    productEditRequest: {
      findFirst: async ({ where }: any) => {
        const matches = store.editRequests
          .filter((r) => {
            if (where?.productId && r.productId !== where.productId) return false;
            if (where?.requestType && r.requestType !== where.requestType) return false;
            if (where?.status && r.status !== where.status) return false;
            return true;
          })
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        return matches[0] ? { ...matches[0] } : null;
      },
      create: async ({ data }: any) => {
        const created = {
          id: `rev-${++seq}`,
          createdAt: new Date(),
          reviewedAt: null,
          adminId: null,
          rejectionReason: null,
          ...data,
        };
        store.editRequests.push(created);
        return { ...created };
      },
      update: async ({ where, data }: any) => {
        const idx = store.editRequests.findIndex((r) => r.id === where.id);
        if (idx === -1) throw new Error(`EditRequest ${where.id} not found`);
        store.editRequests[idx] = { ...store.editRequests[idx], ...data };
        return { ...store.editRequests[idx] };
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (let i = 0; i < store.editRequests.length; i++) {
          const r = store.editRequests[i];
          if (
            (!where?.productId || r.productId === where.productId) &&
            (!where?.requestType || r.requestType === where.requestType) &&
            (!where?.status || r.status === where.status)
          ) {
            store.editRequests[i] = { ...r, ...data };
            count++;
          }
        }
        return { count };
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
      findUnique: async ({ where }: any) => {
        const found = store.variants.find(
          (v) =>
            (where.id && v.id === where.id) ||
            (where.sku && v.sku === where.sku),
        );
        return found ? { ...found } : null;
      },
      findMany: async ({ where }: any) =>
        store.variants
          .filter((v) => !where?.productId || v.productId === where.productId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((v) => ({ ...v, attributes: { ...v.attributes } })),
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
        const invCreate = data.inventoryItems?.create;
        const inventoryItems = invCreate
          ? [
              {
                id: `inv-${++seq}`,
                variantId,
                locationId: invCreate.locationId,
                quantityAvailable: invCreate.quantityAvailable ?? 0,
                quantityReserved: invCreate.quantityReserved ?? 0,
                quantityDamaged: invCreate.quantityDamaged ?? 0,
              },
            ]
          : [];
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
          inventoryItems,
          orderItems: [],
          inboundItems: [],
        };
        store.variants.push(created);
        return { ...created };
      },
      delete: async ({ where }: any) => {
        store.variants = store.variants.filter((v) => v.id !== where.id);
      },
    },
    inventoryAuditLog: {
      deleteMany: async () => ({ count: 0 }),
    },
    inAppNotification: {
      create: async ({ data }: any) => {
        const created = { id: `notif-${++seq}`, ...data };
        store.notifications.push(created);
        return created;
      },
    },
    activityLog: {
      create: async ({ data }: any) => {
        const created = { id: `log-${++seq}`, ...data };
        store.activityLogs.push(created);
        return created;
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

describe('InventoryRepository published product revision workflow', () => {
  it('submitRevision keeps live product fields untouched and stores a pending revision request', async () => {
    const { repo, store } = createMockPrismaHarness();

    const result: any = await repo.submitRevision(
      'prod-1',
      'merch-1',
      {
        title: 'Classic Cotton Tee (Updated)',
        sellingPrice: 890,
        colors: [{ id: 'c-red', name: 'Crimson', originalName: 'Red', hex: '#dc2626' }],
        sizes: ['M'],
        variantsList: [
          {
            id: 'var-1',
            variantSku: 'MC-101-TSHIRT01-RED-M',
            color: 'Crimson',
            originalColor: 'Red',
            size: 'M',
            originalSize: 'M',
            stock: 40,
            price: 890,
          },
        ],
      },
      'Updated color shade from Red to Crimson',
    );

    assert.equal(store.product.title, 'Classic Cotton Tee');
    assert.equal(store.product.sellingPrice, 750);
    assert.equal(store.product.status, 'APPROVED');
    assert.equal(store.product.lifecycleStatus, 'ACTIVE');
    assert.equal(store.product.editState, 'EDIT_APPROVAL_PENDING');
    assert.equal(store.variants[0].attributes.color, 'Red');

    assert.equal(store.editRequests.length, 1);
    assert.equal(store.editRequests[0].requestType, 'REVISION_APPROVAL');
    assert.equal(store.editRequests[0].status, 'PENDING');
    assert.equal(store.editRequests[0].originalSnapshot.title, 'Classic Cotton Tee');
    assert.equal(
      store.editRequests[0].proposedSnapshot.title,
      'Classic Cotton Tee (Updated)',
    );
    assert.ok(result);
    assert.equal(result.editState, 'EDIT_APPROVAL_PENDING');
    assert.equal(result.editRequests.length, 1);
  });

  it('submitting another edit while already pending updates the existing pending request in place', async () => {
    const { repo, store } = createMockPrismaHarness();

    await repo.submitRevision('prod-1', 'merch-1', {
      title: 'First Proposed Title',
      colors: [{ id: 'c-red', name: 'Crimson', originalName: 'Red', hex: '#dc2626' }],
    });

    await repo.submitRevision(
      'prod-1',
      'merch-1',
      {
        title: 'Second Proposed Title',
        colors: [{ id: 'c-red', name: 'Burgundy', originalName: 'Red', hex: '#881337' }],
      },
      'Refined shade name',
    );

    assert.equal(store.editRequests.length, 1);
    assert.equal(store.editRequests[0].status, 'PENDING');
    assert.equal(store.editRequests[0].originalSnapshot.title, 'Classic Cotton Tee');
    assert.equal(
      store.editRequests[0].proposedSnapshot.title,
      'Second Proposed Title',
    );
    assert.equal(store.editRequests[0].reason, 'Refined shade name');
  });

  it('checkOrderEligibility continues allowing orders while editState is EDIT_APPROVAL_PENDING', async () => {
    const { repo } = createMockPrismaHarness();

    await repo.submitRevision('prod-1', 'merch-1', {
      title: 'Changed Title Pending',
      sellingPrice: 999,
    });

    const eligibility = await repo.checkOrderEligibility('prod-1', 5);
    assert.deepEqual(eligibility, { eligible: true });
  });

  it('reviewRevision APPROVE updates variants in place, adds new color with 0 stock, syncs allColors, and preserves live stock & status', async () => {
    const { repo, store } = createMockPrismaHarness();

    await repo.submitRevision('prod-1', 'merch-1', {
      title: 'Classic Cotton Tee V2',
      sellingPrice: 820,
      purchasePrice: 390,
      colors: [
        { id: 'c-red', name: 'Crimson', originalName: 'Red', hex: '#dc2626' },
        { id: 'c-navy', name: 'Navy Blue', hex: '#1e3a8a' },
      ],
      sizes: ['M'],
      variantsList: [
        {
          id: 'var-1',
          variantSku: 'MC-101-TSHIRT01-RED-M',
          color: 'Crimson',
          originalColor: 'Red',
          size: 'M',
          originalSize: 'M',
          stock: 40,
          price: 820,
        },
        {
          variantCode: 'NAV-M',
          color: 'Navy Blue',
          size: 'M',
          stock: 0,
          price: 820,
        },
      ],
    });

    const approved: any = await repo.reviewRevision('prod-1', 'admin-1', 'APPROVE');

    assert.equal(store.product.title, 'Classic Cotton Tee V2');
    assert.equal(store.product.sellingPrice, 820);
    assert.equal(store.product.purchasePrice, 390);
    assert.equal(store.product.status, 'APPROVED');
    assert.equal(store.product.lifecycleStatus, 'ACTIVE');
    assert.equal(store.product.editState, 'NONE');

    assert.equal(store.editRequests[0].status, 'APPROVED');
    assert.equal(store.variants.length, 2);

    const renamedVariant = store.variants.find((v) => v.id === 'var-1');
    assert.ok(renamedVariant);
    assert.equal(renamedVariant.attributes.color, 'Crimson');
    assert.equal(renamedVariant.title, 'Crimson / M');
    assert.equal(renamedVariant.inventoryItems[0].quantityAvailable, 40);

    const addedVariant = store.variants.find((v) => v.id !== 'var-1');
    assert.ok(addedVariant);
    assert.equal(addedVariant.attributes.color, 'Navy Blue');
    assert.equal(addedVariant.title, 'Navy Blue / M');
    assert.equal(addedVariant.inventoryItems[0].quantityAvailable, 0);

    assert.deepEqual(
      store.variants[0].attributes.allColors.map((c: any) => c.name),
      ['Crimson', 'Navy Blue'],
    );
    assert.equal(approved.editState, 'NONE');
  });

  it('reviewRevision REJECT leaves live product unchanged and records rejectionReason', async () => {
    const { repo, store } = createMockPrismaHarness();

    await repo.submitRevision('prod-1', 'merch-1', {
      title: 'Unwanted Title',
      colors: [{ id: 'c-red', name: 'Neon Pink', originalName: 'Red', hex: '#ec4899' }],
    });

    await repo.reviewRevision('prod-1', 'admin-1', 'REJECT', 'Wrong color naming');

    assert.equal(store.product.title, 'Classic Cotton Tee');
    assert.equal(store.variants[0].attributes.color, 'Red');
    assert.equal(store.product.editState, 'NONE');
    assert.equal(store.editRequests[0].status, 'REJECTED');
    assert.equal(store.editRequests[0].rejectionReason, 'Wrong color naming');
  });

  it('cancelRevision resets editState to NONE and cancels the pending request without changing live fields', async () => {
    const { repo, store } = createMockPrismaHarness();

    await repo.submitRevision('prod-1', 'merch-1', {
      title: 'Cancelled Edit Title',
    });

    await repo.cancelRevision('prod-1', 'merch-1');

    assert.equal(store.product.title, 'Classic Cotton Tee');
    assert.equal(store.product.editState, 'NONE');
    assert.equal(store.editRequests[0].status, 'CANCELLED');
  });
});
