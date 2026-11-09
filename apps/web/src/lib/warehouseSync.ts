import {
  MerchantOrderItem,
  MerchantProductItem,
  MerchantProfileData,
  ResellerMemo,
} from '@/features/merchant/portal/types';
import {
  INITIAL_MERCHANT_ORDERS,
  INITIAL_MERCHANT_PRODUCTS,
  INITIAL_MERCHANT_PROFILE,
  STORAGE_KEY_MERCHANT_ORDERS,
  STORAGE_KEY_MERCHANT_PRODUCTS,
} from '@/features/merchant/portal/mockData';
import { WarehouseProductItem } from '@/features/admin/products/types';
import {
  INITIAL_PRODUCTS,
  PRESET_THUMBNAILS,
  STORAGE_KEY_PRODUCTS,
} from '@/features/admin/products/mockData';
import { CourierPartner, OrderStage, WarehousePipelineOrder } from '@/features/admin/orders/types';
import { INITIAL_PIPELINE_ORDERS, STORAGE_KEY_ORDERS } from '@/features/admin/orders/mockData';

const DEFAULT_SEED_MERCHANT_PRODUCT_IDS = new Set(INITIAL_MERCHANT_PRODUCTS.map((p) => p.id));
const DEFAULT_SEED_MERCHANT_ORDER_IDS = new Set(
  INITIAL_MERCHANT_ORDERS.map((o) => o.orderNumber || o.id)
);

function mapCategoryToAdmin(
  category?: string,
  productType?: string
): WarehouseProductItem['category'] {
  const raw = `${category || ''} ${productType || ''}`.toLowerCase();
  if (raw.includes('electro') || raw.includes('gadget') || raw.includes('audio')) {
    return 'Electronics';
  }
  if (raw.includes('foot') || raw.includes('shoe') || raw.includes('boot') || raw.includes('sneaker')) {
    return 'Footwear';
  }
  if (
    raw.includes('access') ||
    raw.includes('bag') ||
    raw.includes('watch') ||
    raw.includes('beauty') ||
    raw.includes('grocery')
  ) {
    return 'Accessories';
  }
  return 'Apparel';
}

function normalizeFullSku(sku: string, merchantCode: string): { shortSku: string; fullSku: string } {
  const cleanCode = (merchantCode || 'MC-101').trim().toUpperCase();
  const cleanSku = (sku || 'SKU-001').trim().toUpperCase();
  if (cleanSku.startsWith(`${cleanCode}-`)) {
    return {
      shortSku: cleanSku.slice(cleanCode.length + 1),
      fullSku: cleanSku,
    };
  }
  return {
    shortSku: cleanSku,
    fullSku: `${cleanCode}-${cleanSku}`,
  };
}

export function convertMerchantProductToWarehouse(
  item: MerchantProductItem,
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE,
  status: WarehouseProductItem['status'] = 'PENDING_APPROVAL'
): WarehouseProductItem {
  const merchantCode = profile.merchantCode || 'MC-101';
  const merchantName = profile.storeName || "Sabbir's Store";
  const { shortSku, fullSku } = normalizeFullSku(item.sku, merchantCode);

  const variantParts = (item.variantLabel || '').split('/').map((s) => s.trim());
  const color = item.colors?.[0]?.name || variantParts[0] || 'Standard';
  const size = item.sizes?.[0] || variantParts[1] || 'Standard';
  const binCode =
    item.bin && item.bin !== 'Unassigned' && item.bin !== 'PENDING'
      ? item.bin.split('-').slice(0, 3).join('-') || 'A-01-02'
      : 'A-01-02';

  return {
    id: item.id,
    title: item.title,
    category: mapCategoryToAdmin(item.category, item.productType),
    merchantCode,
    merchantName,
    shortSku,
    fullSku,
    color,
    size,
    binCode,
    stock: item.stock,
    price: item.price,
    status,
    submittedAt: 'Just now',
    imageUrl: item.imageUrl || item.colors?.[0]?.imageUrl || PRESET_THUMBNAILS[0].url,
  };
}

function getStoredAdminProducts(): WarehouseProductItem[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_PRODUCTS;
}

function getStoredMerchantProducts(): MerchantProductItem[] {
  if (typeof window === 'undefined') return INITIAL_MERCHANT_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MERCHANT_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_MERCHANT_PRODUCTS;
}

function getStoredAdminOrders(): WarehousePipelineOrder[] {
  if (typeof window === 'undefined') return INITIAL_PIPELINE_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_PIPELINE_ORDERS;
}

function getStoredMerchantOrders(): MerchantOrderItem[] {
  if (typeof window === 'undefined') return INITIAL_MERCHANT_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MERCHANT_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_MERCHANT_ORDERS;
}

function isMatchingProduct(
  merchantProd: MerchantProductItem,
  adminProd: WarehouseProductItem
): boolean {
  if (merchantProd.id === adminProd.id) return true;
  const mSku = (merchantProd.sku || '').toUpperCase();
  return (
    mSku === adminProd.fullSku.toUpperCase() ||
    mSku === adminProd.shortSku.toUpperCase() ||
    `${adminProd.merchantCode}-${mSku}`.toUpperCase() === adminProd.fullSku.toUpperCase()
  );
}

/**
 * Merchant -> Admin: When Merchant uploads new products, add them to Admin's Pending Approval queue.
 */
export function syncMerchantProductsAddedToAdmin(
  newItems: MerchantProductItem[],
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE
): void {
  if (typeof window === 'undefined' || newItems.length === 0) return;
  try {
    const currentAdmin = getStoredAdminProducts();
    const mappedNew = newItems
      .filter((item) => !currentAdmin.some((ap) => isMatchingProduct(item, ap)))
      .map((item) => convertMerchantProductToWarehouse(item, profile, 'PENDING_APPROVAL'));

    if (mappedNew.length === 0) return;

    const updatedAdmin = [...mappedNew, ...currentAdmin];
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedAdmin));
    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
    );
  } catch {
    // ignore storage errors
  }
}

/**
 * Merchant -> Admin: When Merchant edits or adjusts stock of a product, sync to Admin catalog.
 */
export function syncMerchantProductUpdatedToAdmin(
  updatedItem: MerchantProductItem,
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE
): void {
  if (typeof window === 'undefined') return;
  try {
    const currentAdmin = getStoredAdminProducts();
    let matched = false;
    const nextAdmin = currentAdmin.map((ap) => {
      if (!isMatchingProduct(updatedItem, ap)) return ap;
      matched = true;
      const { shortSku, fullSku } = normalizeFullSku(updatedItem.sku, ap.merchantCode);
      return {
        ...ap,
        title: updatedItem.title,
        shortSku,
        fullSku,
        stock: updatedItem.stock,
        price: updatedItem.price,
        imageUrl: updatedItem.imageUrl || ap.imageUrl,
      };
    });

    if (!matched) {
      nextAdmin.unshift(
        convertMerchantProductToWarehouse(updatedItem, profile, 'PENDING_APPROVAL')
      );
    }

    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdmin));
    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
    );
  } catch {
    // ignore
  }
}

/**
 * Merchant -> Admin: When Merchant deletes product(s), remove them from Admin catalog as well.
 */
export function syncMerchantProductsDeletedToAdmin(deletedProducts: MerchantProductItem[]): void {
  if (typeof window === 'undefined' || deletedProducts.length === 0) return;
  try {
    const currentAdmin = getStoredAdminProducts();
    const nextAdmin = currentAdmin.filter(
      (ap) => !deletedProducts.some((mp) => isMatchingProduct(mp, ap))
    );
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdmin));
    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
    );
  } catch {
    // ignore
  }
}

/**
 * Admin -> Merchant: When Admin approves, updates bin/stock, adds, or deletes products, sync back to Merchant.
 */
export function syncAdminProductsToMerchant(
  adminProducts: WarehouseProductItem[],
  deletedAdminProducts: WarehouseProductItem[] = []
): void {
  if (typeof window === 'undefined') return;
  try {
    let merchantProducts = getStoredMerchantProducts();

    // 1. Remove any products deleted/rejected by Admin
    if (deletedAdminProducts.length > 0) {
      merchantProducts = merchantProducts.filter(
        (mp) => !deletedAdminProducts.some((delAp) => isMatchingProduct(mp, delAp))
      );
    }

    // 2. Update existing Merchant products from Admin products
    merchantProducts = merchantProducts.map((mp) => {
      const matchedAdmin = adminProducts.find((ap) => isMatchingProduct(mp, ap));
      if (!matchedAdmin) return mp;
      return {
        ...mp,
        title: matchedAdmin.title,
        stock: matchedAdmin.stock,
        price: matchedAdmin.price,
        bin: matchedAdmin.binCode,
        status:
          matchedAdmin.status === 'APPROVED'
            ? ('PUBLISHED' as const)
            : ('DRAFT' as const),
      };
    });

    // 3. Add any new MC-101 approved products created directly by Admin that aren't in Merchant catalog
    const newFromAdmin = adminProducts.filter(
      (ap) =>
        ap.merchantCode === 'MC-101' &&
        ap.status === 'APPROVED' &&
        !INITIAL_PRODUCTS.some((seed) => seed.id === ap.id) &&
        !merchantProducts.some((mp) => isMatchingProduct(mp, ap))
    );

    if (newFromAdmin.length > 0) {
      const converted: MerchantProductItem[] = newFromAdmin.map((ap) => ({
        id: ap.id,
        title: ap.title,
        variantLabel: `${ap.color} / ${ap.size}`,
        category: ap.category,
        sku: ap.fullSku,
        barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        stock: ap.stock,
        reserved: 0,
        price: ap.price,
        bin: ap.binCode,
        status: 'PUBLISHED',
        totalOrders: 0,
        imageUrl: ap.imageUrl,
      }));
      merchantProducts = [...converted, ...merchantProducts];
    }

    localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(merchantProducts));
  } catch {
    // ignore
  }
}

/**
 * Reconcile any previously uploaded Merchant products into Admin's product list on load.
 */
export function reconcileAdminProductsWithMerchant(
  adminProducts: WarehouseProductItem[]
): WarehouseProductItem[] {
  if (typeof window === 'undefined') return adminProducts;
  try {
    const merchantProducts = getStoredMerchantProducts();
    const customMerchantItems = merchantProducts.filter(
      (mp) =>
        !DEFAULT_SEED_MERCHANT_PRODUCT_IDS.has(mp.id) &&
        !adminProducts.some((ap) => isMatchingProduct(mp, ap))
    );
    if (customMerchantItems.length === 0) return adminProducts;

    const converted = customMerchantItems.map((mp) =>
      convertMerchantProductToWarehouse(mp, INITIAL_MERCHANT_PROFILE, 'PENDING_APPROVAL')
    );
    const merged = [...converted, ...adminProducts];
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(merged));
    return merged;
  } catch {
    return adminProducts;
  }
}

/**
 * Convert a MerchantOrderItem to an Admin WarehousePipelineOrder
 */
export function convertMerchantOrderToWarehouse(
  order: MerchantOrderItem,
  merchantProducts: MerchantProductItem[],
  memoList: ResellerMemo[],
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE
): WarehousePipelineOrder {
  const merchantCode = profile.merchantCode || 'MC-101';
  const merchantName = profile.storeName || "Sabbir's Store";
  const primaryLine = order.lineItems?.[0];
  const primaryProduct =
    merchantProducts.find((p) => p.id === (primaryLine?.id || order.productId)) ||
    merchantProducts[0];

  const rawSku = primaryLine?.sku || primaryProduct?.sku || 'SKU-001';
  const { fullSku } = normalizeFullSku(rawSku, merchantCode);

  const variantStr = primaryLine?.variant || primaryProduct?.variantLabel || 'Standard / L';
  const variantParts = variantStr.split('/').map((s) => s.trim());
  const color = variantParts[0] || 'Standard';
  const size = variantParts[1] || 'L';

  const productTitle =
    order.lineItems && order.lineItems.length > 1
      ? `${order.lineItems[0].title} (+${order.lineItems.length - 1} more)`
      : primaryLine?.title || primaryProduct?.title || order.items || 'Warehouse Order Item';

  const matchedMemo = memoList.find((m) => m.code === order.memoCode) || memoList[0];
  const addrLower = (order.address || '').toLowerCase();
  const city = addrLower.includes('chattogram') || addrLower.includes('chittagong')
    ? 'Chattogram'
    : addrLower.includes('sylhet')
    ? 'Sylhet'
    : addrLower.includes('rajshahi')
    ? 'Rajshahi'
    : 'Dhaka';

  const validCourier: CourierPartner =
    order.courier === 'Pathao' || order.courier === 'RedX' || order.courier === 'Steadfast'
      ? order.courier
      : 'Steadfast';

  const stageMap: Record<MerchantOrderItem['status'], OrderStage> = {
    PENDING: 'PICK',
    ALLOCATED: 'PICK',
    PICKED: 'PACK',
    PACKED: 'PACK',
    DISPATCHED: 'DISPATCH',
    DELIVERED: 'HANDED_OVER',
    CANCELLED: 'CANCELLED',
  };

  return {
    id: order.orderNumber || order.id,
    createdAt: order.date || 'Just now',
    merchantCode,
    merchantName,
    customerName: order.customer,
    customerPhone: order.phone,
    customerAddress: order.address,
    city,
    productTitle,
    productImage:
      primaryLine?.imageUrl || primaryProduct?.imageUrl || PRESET_THUMBNAILS[0].url,
    bin: primaryProduct?.bin?.split('-').slice(0, 3).join('-') || 'A-01-02',
    color,
    size,
    sku: fullSku,
    qty: order.qty || 1,
    stockAvailable: Math.max(0, primaryProduct?.stock ?? 50),
    memoCode: order.memoCode || 'MEMO-DEFAULT',
    resellerName: matchedMemo?.resellerName || merchantName,
    resellerPhone: matchedMemo?.phone || profile.phone || '01712-345678',
    resellerAddress: matchedMemo?.address || profile.location || 'Dhaka, Bangladesh',
    codAmount: order.codAmount ?? order.amount,
    courier: validCourier,
    trackingCode: order.trackingId,
    stage: stageMap[order.status] || 'PICK',
  };
}

/**
 * Merchant -> Admin: When Merchant creates a new order, add it to Admin Orders Pipeline and deduct Admin stock.
 */
export function syncMerchantOrderCreatedToAdmin(
  order: MerchantOrderItem,
  itemsToDeduct: { productId: string; qty: number }[],
  merchantProducts: MerchantProductItem[],
  memoList: ResellerMemo[],
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE
): void {
  if (typeof window === 'undefined') return;
  try {
    const adminOrders = getStoredAdminOrders();
    const orderId = order.orderNumber || order.id;

    if (!adminOrders.some((ao) => ao.id === orderId)) {
      const pipelineOrder = convertMerchantOrderToWarehouse(
        order,
        merchantProducts,
        memoList,
        profile
      );
      const nextAdminOrders = [pipelineOrder, ...adminOrders];
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(nextAdminOrders));
    }

    // Deduct stock on matching Admin products
    if (itemsToDeduct.length > 0) {
      const adminProducts = getStoredAdminProducts();
      const nextAdminProducts = adminProducts.map((ap) => {
        const matchedMerchantProd = merchantProducts.find((mp) =>
          isMatchingProduct(mp, ap)
        );
        const deductEntry = itemsToDeduct.find(
          (d) =>
            d.productId === ap.id ||
            (matchedMerchantProd && d.productId === matchedMerchantProd.id)
        );
        if (!deductEntry) return ap;
        return {
          ...ap,
          stock: Math.max(0, ap.stock - deductEntry.qty),
        };
      });
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdminProducts));
    }

    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
    );
  } catch {
    // ignore
  }
}

/**
 * Merchant -> Admin: When Merchant cancels an order, mark it CANCELLED in Admin pipeline & restore stock.
 */
export function syncMerchantOrderCancelledToAdmin(
  orderId: string,
  itemsToRestore: { productId: string; qty: number }[],
  merchantProducts: MerchantProductItem[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const adminOrders = getStoredAdminOrders();
    const nextAdminOrders = adminOrders.map((ao) =>
      ao.id === orderId
        ? { ...ao, stage: 'CANCELLED' as const, stockAvailable: ao.stockAvailable + ao.qty }
        : ao
    );
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(nextAdminOrders));

    if (itemsToRestore.length > 0) {
      const adminProducts = getStoredAdminProducts();
      const nextAdminProducts = adminProducts.map((ap) => {
        const matchedMerchantProd = merchantProducts.find((mp) =>
          isMatchingProduct(mp, ap)
        );
        const restoreEntry = itemsToRestore.find(
          (r) =>
            r.productId === ap.id ||
            (matchedMerchantProd && r.productId === matchedMerchantProd.id)
        );
        if (!restoreEntry) return ap;
        return {
          ...ap,
          stock: ap.stock + restoreEntry.qty,
        };
      });
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdminProducts));
    }

    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
    );
  } catch {
    // ignore
  }
}

/**
 * Admin -> Merchant: Sync Admin pipeline order stage/courier/tracking changes back to Merchant orders.
 */
export function syncAdminOrdersToMerchant(adminOrders: WarehousePipelineOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    let merchantOrders = getStoredMerchantOrders();

    const stageToStatus: Record<OrderStage, MerchantOrderItem['status']> = {
      PICK: 'PENDING',
      WAITING: 'PENDING',
      PACK: 'PACKED',
      DISPATCH: 'DISPATCHED',
      HANDED_OVER: 'DELIVERED',
      CANCELLED: 'CANCELLED',
    };

    merchantOrders = merchantOrders.map((mo) => {
      const moId = mo.orderNumber || mo.id;
      const matchedAdmin = adminOrders.find((ao) => ao.id === moId || ao.id === mo.id);
      if (!matchedAdmin) return mo;
      return {
        ...mo,
        status: stageToStatus[matchedAdmin.stage] || mo.status,
        courier: matchedAdmin.courier,
        trackingId: matchedAdmin.trackingCode || mo.trackingId,
      };
    });

    // Also add any new MC-101 orders created from Admin Panel that aren't in Merchant's order list yet
    const newAdminMc101Orders = adminOrders.filter(
      (ao) =>
        ao.merchantCode === 'MC-101' &&
        !INITIAL_PIPELINE_ORDERS.some((seed) => seed.id === ao.id) &&
        !merchantOrders.some((mo) => (mo.orderNumber || mo.id) === ao.id || mo.id === ao.id)
    );

    if (newAdminMc101Orders.length > 0) {
      const converted: MerchantOrderItem[] = newAdminMc101Orders.map((ao) => ({
        id: ao.id,
        orderNumber: ao.id,
        date: ao.createdAt || 'Today, Just now',
        customer: ao.customerName,
        phone: ao.customerPhone,
        address: ao.customerAddress,
        productId: 'p-1',
        items: `${ao.productTitle} (${ao.color} / ${ao.size}) x ${ao.qty}`,
        qty: ao.qty,
        amount: ao.codAmount,
        codAmount: ao.codAmount,
        memoCode: ao.memoCode,
        status: stageToStatus[ao.stage] || 'PENDING',
        courier: ao.courier,
        trackingId: ao.trackingCode,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Unpaid',
      }));
      merchantOrders = [...converted, ...merchantOrders];
    }

    localStorage.setItem(STORAGE_KEY_MERCHANT_ORDERS, JSON.stringify(merchantOrders));
  } catch {
    // ignore
  }
}

/**
 * Reconcile any previously created Merchant orders into Admin's pipeline order list on load.
 */
export function reconcileAdminOrdersWithMerchant(
  adminOrders: WarehousePipelineOrder[]
): WarehousePipelineOrder[] {
  if (typeof window === 'undefined') return adminOrders;
  try {
    const merchantOrders = getStoredMerchantOrders();
    const merchantProducts = getStoredMerchantProducts();
    const customMerchantOrders = merchantOrders.filter((mo) => {
      const moId = mo.orderNumber || mo.id;
      return (
        !DEFAULT_SEED_MERCHANT_ORDER_IDS.has(moId) &&
        !adminOrders.some((ao) => ao.id === moId || ao.id === mo.id)
      );
    });

    if (customMerchantOrders.length === 0) return adminOrders;

    const converted = customMerchantOrders.map((mo) =>
      convertMerchantOrderToWarehouse(mo, merchantProducts, [], INITIAL_MERCHANT_PROFILE)
    );
    const merged = [...converted, ...adminOrders];
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(merged));
    return merged;
  } catch {
    return adminOrders;
  }
}

/**
 * Sync Admin Merchant Directory's per-merchant products & orders view with latest warehouse storage.
 */
export function getSyncedMerchantDirectoryLists(
  baseProducts: import('@/features/admin/merchants/types').MerchantProductItem[],
  baseOrders: import('@/features/admin/merchants/types').MerchantOrderItem[]
): {
  products: import('@/features/admin/merchants/types').MerchantProductItem[];
  orders: import('@/features/admin/merchants/types').MerchantOrderItem[];
} {
  if (typeof window === 'undefined') {
    return { products: baseProducts, orders: baseOrders };
  }
  try {
    const adminProds = reconcileAdminProductsWithMerchant(getStoredAdminProducts());
    const adminOrders = reconcileAdminOrdersWithMerchant(getStoredAdminOrders());

    const extraProds: import('@/features/admin/merchants/types').MerchantProductItem[] = adminProds
      .filter(
        (ap) =>
          ap.status === 'APPROVED' &&
          !baseProducts.some((bp) => bp.sku === ap.fullSku || bp.id === ap.id)
      )
      .map((ap) => ({
        id: ap.id,
        merchantCode: ap.merchantCode,
        title: ap.title,
        category: ap.category === 'Accessories' ? 'Beauty' : ap.category,
        sku: ap.fullSku,
        barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        color: ap.color,
        size: ap.size,
        price: ap.price,
        wholesalePrice: Math.round(ap.price * 0.75),
        stock: ap.stock,
        reserved: 0,
        damaged: 0,
        bin: ap.binCode,
        imageUrl: ap.imageUrl,
      }));

    const syncedProds = [
      ...extraProds,
      ...baseProducts.map((bp) => {
        const match = adminProds.find((ap) => ap.fullSku === bp.sku || ap.id === bp.id);
        return match ? { ...bp, stock: match.stock, bin: match.binCode, price: match.price } : bp;
      }),
    ];

    const stageMap: Record<
      OrderStage,
      import('@/features/admin/merchants/types').MerchantOrderItem['status']
    > = {
      PICK: 'ALLOCATED',
      WAITING: 'PICKING',
      PACK: 'PACKED',
      DISPATCH: 'DISPATCHED',
      HANDED_OVER: 'DELIVERED',
      CANCELLED: 'CANCELLED',
    };

    const extraOrders: import('@/features/admin/merchants/types').MerchantOrderItem[] = adminOrders
      .filter((ao) => !baseOrders.some((bo) => bo.id === ao.id))
      .map((ao) => ({
        id: ao.id,
        merchantCode: ao.merchantCode,
        date: ao.createdAt || 'Just now',
        isoDate: new Date().toISOString().slice(0, 10),
        periodBucket: 'DAY',
        customer: ao.customerName,
        phone: ao.customerPhone,
        address: ao.customerAddress,
        city: ao.city,
        items: `${ao.productTitle} (${ao.color} / ${ao.size})`,
        sku: ao.sku,
        qty: ao.qty,
        memoCode: ao.memoCode,
        courier: ao.courier,
        status: stageMap[ao.stage] || 'ALLOCATED',
        amount: ao.codAmount,
        fraudRatio: 96,
      }));

    const syncedOrders = [
      ...extraOrders,
      ...baseOrders.map((bo) => {
        const match = adminOrders.find((ao) => ao.id === bo.id);
        return match
          ? { ...bo, status: stageMap[match.stage] || bo.status, courier: match.courier }
          : bo;
      }),
    ];

    return { products: syncedProds, orders: syncedOrders };
  } catch {
    return { products: baseProducts, orders: baseOrders };
  }
}

