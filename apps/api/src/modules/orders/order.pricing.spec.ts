import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';

function createOrderPricingHarness() {
  const merchant = {
    id: 'm-uuid-101',
    merchantCode: 'MC-101',
    businessName: "Sabbir's Store",
    baseHandlingFee: 45,
  };

  const variant = {
    id: 'var-uuid-1',
    productId: 'prod-uuid-1',
    sku: 'MC-101-HOOD-BLK-XL',
    title: 'Obsidian Black / XL',
    price: 800,
    product: {
      id: 'prod-uuid-1',
      title: 'Heavyweight Fleece Hoodie',
    },
  };

  let createdOrderPayload: any = null;

  const mockPrisma: any = {
    merchant: {
      findFirst: async () => merchant,
    },
    productVariant: {
      findFirst: async ({ where }: any) => {
        const conds = where?.OR || [];
        const matched = conds.some(
          (c: any) =>
            c.id === variant.id ||
            c.sku === variant.sku ||
            c.productId === variant.productId ||
            c.product?.id === variant.productId,
        );
        return matched ? variant : null;
      },
    },
  };

  const mockOrderRepo: any = {
    countCustomerOrders: async () => 0,
    createOrderWithItems: async (data: any) => {
      createdOrderPayload = data;
      return { id: 'ORD-PRICING-1', ...data };
    },
  };

  const mockInventoryService: any = {
    reserveStockForOrder: async () => undefined,
  };

  const mockBillingService: any = {};

  const service = new OrderService(
    mockOrderRepo,
    mockInventoryService,
    mockBillingService,
    mockPrisma,
  );

  return {
    service,
    getCreatedPayload: () => createdOrderPayload,
  };
}

describe('OrderService Custom Order Selling Price Calculation', () => {
  it('persists custom higher selling price per item and derives subtotal, totalAmount, and codAmount', async () => {
    const { service, getCreatedPayload } = createOrderPricingHarness();

    const created = await service.createOrder('MC-101', {
      externalOrderId: 'ORD-CUSTOM-101',
      customerName: 'Nafis Chowdhury',
      customerPhone: '01715882211',
      customerAddress: 'Banani, Dhaka',
      memoCode: 'MEMO-DEFAULT',
      deliveryFee: 60,
      discount: 100,
      advancePayment: 500,
      advancePaymentMethod: 'bKash',
      // Deliberately omit totalAmount & codAmount (or pass stale ones) to prove server computes from item selling price
      items: [
        {
          variantId: 'var-uuid-1',
          quantity: 2,
          unitPrice: 1350, // Catalog declared price is 800, merchant sells at 1350
        },
      ],
    });

    const payload = getCreatedPayload();
    assert.ok(payload);
    assert.equal(payload.items[0].unitPrice, 1350);
    assert.equal(payload.subtotal, 2700);
    assert.equal(payload.totalAmount, 2660); // 2700 + 60 delivery - 100 discount
    assert.equal(payload.codAmount, 2160); // 2660 - 500 advance
    assert.equal(created.totalAmount, 2660);
    assert.equal(payload.paymentStatus, 'Partial');
  });

  it('falls back to declared variant price when item unitPrice is omitted', async () => {
    const { service, getCreatedPayload } = createOrderPricingHarness();

    await service.createOrder('MC-101', {
      externalOrderId: 'ORD-DEFAULT-102',
      customerName: 'Samira Rahman',
      customerPhone: '01614229900',
      customerAddress: 'Dhanmondi, Dhaka',
      memoCode: 'MEMO-DEFAULT',
      deliveryFee: 60,
      items: [
        {
          variantId: 'var-uuid-1',
          quantity: 2,
        },
      ],
    });

    const payload = getCreatedPayload();
    assert.equal(payload.items[0].unitPrice, 800);
    assert.equal(payload.subtotal, 1600);
    assert.equal(payload.totalAmount, 1660);
    assert.equal(payload.codAmount, 1660);
    assert.equal(payload.paymentStatus, 'Unpaid');
  });

  it('throws BadRequestException when custom selling price is negative', async () => {
    const { service } = createOrderPricingHarness();

    await assert.rejects(
      () =>
        service.createOrder('MC-101', {
          customerName: 'Invalid Price Test',
          customerPhone: '01715882211',
          customerAddress: 'Dhaka',
          memoCode: 'MEMO-DEFAULT',
          items: [
            {
              variantId: 'var-uuid-1',
              quantity: 1,
              unitPrice: -250,
            },
          ],
        }),
      BadRequestException,
    );
  });

  it('resolves distinct color variants sharing productId/variantId via variantLabel and reserves each variant separately (Brown 7 + Pink 7)', async () => {
    const merchant = {
      id: 'm-uuid-101',
      merchantCode: 'MC-101',
      businessName: "Sabbir's Store",
      baseHandlingFee: 45,
    };

    const hatProduct = {
      id: 'prod-hat-1',
      title: 'Classic Baseball Hat',
      baseSku: 'HAT-BASE',
    };

    const variants = [
      {
        id: 'var-brown',
        productId: 'prod-hat-1',
        sku: 'HAT-BRN',
        title: 'Brown / Free Size',
        attributes: { color: 'Brown', size: 'Free Size', declaredStock: 20 },
        price: 500,
        product: hatProduct,
      },
      {
        id: 'var-pink',
        productId: 'prod-hat-1',
        sku: 'HAT-PNK',
        title: 'Pink / Free Size',
        attributes: { color: 'Pink', size: 'Free Size', declaredStock: 20 },
        price: 500,
        product: hatProduct,
      },
    ];

    let createdOrderPayload: any = null;
    let reservedItemsCaptured: any[] = [];

    const matchCondition = (v: any, cond: any) =>
      (cond.id && v.id === cond.id) ||
      (cond.sku && v.sku === cond.sku) ||
      (cond.productId && v.productId === cond.productId) ||
      (cond.product?.id && v.productId === cond.product.id) ||
      (cond.product?.baseSku && v.product?.baseSku === cond.product.baseSku);

    const mockPrisma: any = {
      merchant: {
        findFirst: async () => merchant,
      },
      productVariant: {
        findFirst: async ({ where }: any) => {
          const conds = where?.OR || [where];
          return variants.find((v) => conds.some((c: any) => c && matchCondition(v, c))) || null;
        },
        findMany: async ({ where }: any) => {
          const conds = where?.OR || [where];
          return variants.filter((v) => conds.some((c: any) => c && matchCondition(v, c)));
        },
      },
    };

    const mockOrderRepo: any = {
      countCustomerOrders: async () => 0,
      createOrderWithItems: async (data: any) => {
        createdOrderPayload = data;
        return { id: 'ORD-MULTI-1', ...data };
      },
    };

    const mockInventoryService: any = {
      reserveStockForOrder: async (items: any[]) => {
        reservedItemsCaptured = items;
      },
    };

    const service = new OrderService(
      mockOrderRepo,
      mockInventoryService,
      {} as any,
      mockPrisma,
    );

    await service.createOrder('MC-101', {
      customerName: 'Multi Variant Buyer',
      customerPhone: '01715882211',
      customerAddress: 'Dhaka',
      memoCode: 'MEMO-DEFAULT',
      items: [
        {
          variantId: 'prod-hat-1',
          productId: 'prod-hat-1',
          variantLabel: 'Brown · Free Size',
          quantity: 7,
          unitPrice: 500,
        },
        {
          variantId: 'prod-hat-1',
          productId: 'prod-hat-1',
          variantLabel: 'Pink · Free Size',
          quantity: 7,
          unitPrice: 500,
        },
      ],
    } as any);

    assert.equal(reservedItemsCaptured.length, 2);
    assert.deepEqual(reservedItemsCaptured, [
      { variantId: 'var-brown', quantity: 7 },
      { variantId: 'var-pink', quantity: 7 },
    ]);
    assert.equal(createdOrderPayload.items.length, 2);
    assert.equal(createdOrderPayload.items[0].variantId, 'var-brown');
    assert.equal(createdOrderPayload.items[0].quantity, 7);
    assert.equal(createdOrderPayload.items[1].variantId, 'var-pink');
    assert.equal(createdOrderPayload.items[1].quantity, 7);
  });
});
