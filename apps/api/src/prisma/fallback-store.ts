import * as fs from 'fs';
import * as path from 'path';

export interface LocalMerchant {
  id: string;
  merchantCode: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalLocation {
  id: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  binCode: string;
  isDamaged?: boolean;
}

export interface LocalVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  title: string;
  price: number;
  wholesalePrice?: number;
  defaultBinCode?: string;
  imageUrl?: string;
  attributes: Record<string, any>;
  inventoryItems: Array<{
    id: string;
    locationId: string;
    quantityAvailable: number;
    quantityReserved: number;
    quantityDamaged: number;
    location?: LocalLocation;
  }>;
}

export interface LocalProduct {
  id: string;
  merchantId: string;
  title: string;
  description?: string;
  baseSku: string;
  imageUrl?: string;
  images: string[];
  status?: string;
  createdAt: string;
  updatedAt: string;
  merchant?: { merchantCode: string; businessName: string };
  variants: LocalVariant[];
}

export interface LocalUser {
  id: string;
  merchantId?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  merchant?: LocalMerchant;
}

export class FallbackStore {
  private static instance: FallbackStore;
  private filePath: string;
  private data: {
    merchants: LocalMerchant[];
    locations: LocalLocation[];
    products: LocalProduct[];
    users: LocalUser[];
  };

  private constructor() {
    const dataDir = path.resolve(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    this.filePath = path.join(dataDir, 'local-db.json');
    this.data = this.loadData();
  }

  public static getInstance(): FallbackStore {
    if (!FallbackStore.instance) {
      FallbackStore.instance = new FallbackStore();
    }
    return FallbackStore.instance;
  }

  private loadData() {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      } catch {
        // Fall back to seed
      }
    }
    const seed = this.getSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(dataToSave?: any) {
    try {
      const target = dataToSave || this.data;
      fs.writeFileSync(this.filePath, JSON.stringify(target, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[FallbackStore] Failed to write local-db.json:', e);
    }
  }

  private getSeedData() {
    const m101: LocalMerchant = {
      id: 'm-101-uuid',
      merchantCode: 'MC-101',
      businessName: "Sabbir's Store",
      ownerName: 'Sabbir Ahmed',
      email: 'sabbir@sabbirstore.com',
      phone: '01711-223344',
      location: 'Dhanmondi, Dhaka',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const m102: LocalMerchant = {
      id: 'm-102-uuid',
      merchantCode: 'MC-102',
      businessName: 'TechGear BD',
      ownerName: 'Store Owner',
      email: 'contact@techgearbd.com',
      phone: '01911-889900',
      location: 'Panthapath, Dhaka',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const m106: LocalMerchant = {
      id: 'm-106-uuid',
      merchantCode: 'MC-106',
      businessName: 'Store MC-106',
      ownerName: 'Store Owner',
      email: 'mc106@fulfillio.online',
      phone: '01700-000000',
      location: 'Dhaka, Bangladesh',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const locA01: LocalLocation = {
      id: 'loc-a01-01',
      zone: 'A',
      aisle: '01',
      rack: '01',
      shelf: '01',
      binCode: 'A-01-01',
      isDamaged: false,
    };

    const adminUser: LocalUser = {
      id: 'usr-admin',
      name: 'Super Admin',
      email: 'admin@fulfillio.online',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5eWNRg5nZ5Oeq', // admin123
      role: 'SUPER_ADMIN',
    };

    const merchantUser: LocalUser = {
      id: 'usr-m101',
      merchantId: m101.id,
      name: 'Sabbir Ahmed',
      email: 'sabbir@sabbirstore.com',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5eWNRg5nZ5Oeq',
      role: 'MERCHANT',
      merchant: m101,
    };

    return {
      merchants: [m101, m102, m106],
      locations: [locA01],
      products: [],
      users: [adminUser, merchantUser],
    };
  }

  // Merchants
  findMerchantById(merchantId: string): LocalMerchant | null {
    if (!merchantId) return null;
    const clean = merchantId.trim().toUpperCase();
    return (
      this.data.merchants.find(
        (m) =>
          m.id === merchantId ||
          m.merchantCode.toUpperCase() === clean ||
          m.email.toLowerCase() === merchantId.toLowerCase()
      ) || null
    );
  }

  upsertMerchantStub(merchantCode: string): LocalMerchant {
    const cleanCode = merchantCode.trim().toUpperCase();
    const existing = this.findMerchantById(cleanCode);
    if (existing) return existing;

    const newMerchant: LocalMerchant = {
      id: `m-${cleanCode.toLowerCase()}-${Date.now()}`,
      merchantCode: cleanCode,
      businessName: `Merchant Store (${cleanCode})`,
      ownerName: 'Store Owner',
      email: `${cleanCode.toLowerCase()}@fulfillio.online`,
      phone: '01700-000000',
      location: 'Dhaka, Bangladesh',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.merchants.push(newMerchant);
    this.saveData();
    return newMerchant;
  }

  // Locations
  upsertLocation(data: {
    zone: string;
    aisle: string;
    rack: string;
    shelf: string;
    binCode: string;
    isDamaged?: boolean;
  }): LocalLocation {
    const cleanBin = data.binCode.trim().toUpperCase();
    const existing = this.data.locations.find((l) => l.binCode === cleanBin);
    if (existing) {
      existing.isDamaged = data.isDamaged ?? false;
      this.saveData();
      return existing;
    }
    const newLoc: LocalLocation = {
      id: `loc-${cleanBin.toLowerCase()}`,
      ...data,
      binCode: cleanBin,
      isDamaged: data.isDamaged ?? false,
    };
    this.data.locations.push(newLoc);
    this.saveData();
    return newLoc;
  }

  // Products
  findProductByMerchantAndBaseSku(merchantId: string, baseSku: string): LocalProduct | null {
    const cleanSku = baseSku.trim().toUpperCase();
    return (
      this.data.products.find(
        (p) =>
          (p.merchantId === merchantId || p.merchant?.merchantCode === merchantId) &&
          p.baseSku.toUpperCase() === cleanSku
      ) || null
    );
  }

  createProductWithVariants(data: {
    merchantId: string;
    title: string;
    description?: string;
    baseSku: string;
    imageUrl?: string;
    images?: string[];
    status?: string;
    defaultLocationId: string;
    variants: Array<{
      sku: string;
      barcode: string;
      title: string;
      price: number;
      wholesalePrice?: number;
      defaultBinCode?: string;
      initialStock?: number;
      imageUrl?: string;
      attributes?: Record<string, any>;
    }>;
  }): LocalProduct {
    const merchant = this.findMerchantById(data.merchantId) || this.upsertMerchantStub(data.merchantId);
    const prodId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const location =
      this.data.locations.find((l) => l.id === data.defaultLocationId || l.binCode === 'A-01-01') ||
      this.upsertLocation({ zone: 'A', aisle: '01', rack: '01', shelf: '01', binCode: 'A-01-01' });

    const newVariants: LocalVariant[] = data.variants.map((v, idx) => ({
      id: `var-${prodId}-${idx}`,
      productId: prodId,
      sku: v.sku,
      barcode: v.barcode,
      title: v.title,
      price: v.price,
      wholesalePrice: v.wholesalePrice,
      defaultBinCode: v.defaultBinCode || 'Pending Approval',
      imageUrl: v.imageUrl,
      attributes: v.attributes || {},
      inventoryItems: [
        {
          id: `item-${prodId}-${idx}`,
          locationId: location.id,
          quantityAvailable: Math.max(0, Number(v.initialStock) || 0),
          quantityReserved: 0,
          quantityDamaged: 0,
          location,
        },
      ],
    }));

    const newProduct: LocalProduct = {
      id: prodId,
      merchantId: merchant.id,
      title: data.title,
      description: data.description,
      baseSku: data.baseSku,
      imageUrl: data.imageUrl,
      images: data.images || (data.imageUrl ? [data.imageUrl] : []),
      status: data.status || 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      merchant: {
        merchantCode: merchant.merchantCode,
        businessName: merchant.businessName,
      },
      variants: newVariants,
    };

    // Remove any older duplicate with same merchant + baseSku
    this.data.products = this.data.products.filter(
      (p) => !(p.merchantId === merchant.id && p.baseSku === data.baseSku)
    );
    this.data.products.unshift(newProduct);
    this.saveData();

    return newProduct;
  }

  updateProductWithVariants(
    productId: string,
    merchantId: string,
    data: any
  ): LocalProduct {
    let existing = this.data.products.find(
      (p) => p.id === productId || p.baseSku === productId
    );

    if (!existing) {
      // Create if missing
      return this.createProductWithVariants({
        merchantId,
        title: data.title || 'Product',
        description: data.description,
        baseSku: data.baseSku || productId,
        imageUrl: data.imageUrl,
        images: data.images,
        status: data.status || 'PUBLISHED',
        defaultLocationId: 'loc-a01-01',
        variants: data.variants || [],
      });
    }

    if (data.title) existing.title = data.title;
    if (data.description !== undefined) existing.description = data.description;
    if (data.baseSku) existing.baseSku = data.baseSku;
    if (data.imageUrl !== undefined) existing.imageUrl = data.imageUrl;
    if (data.images !== undefined) existing.images = data.images;
    if (data.status !== undefined) existing.status = data.status;
    existing.updatedAt = new Date().toISOString();

    if (data.variants && data.variants.length > 0) {
      existing.variants = data.variants.map((v: any, idx: number) => ({
        id: v.id || `var-${existing!.id}-${idx}`,
        productId: existing!.id,
        sku: v.sku,
        barcode: v.barcode || `890${Date.now()}${idx}`,
        title: v.title,
        price: v.price,
        wholesalePrice: v.wholesalePrice,
        defaultBinCode: v.defaultBinCode || 'Pending Approval',
        imageUrl: v.imageUrl,
        attributes: v.attributes || {},
        inventoryItems: [
          {
            id: `item-${existing!.id}-${idx}`,
            locationId: 'loc-a01-01',
            quantityAvailable: Math.max(0, Number(v.initialStock) || 0),
            quantityReserved: 0,
            quantityDamaged: 0,
          },
        ],
      }));
    }

    this.saveData();
    return existing;
  }

  approveProduct(
    productId: string,
    data: {
      binCode: string;
      finalQty: number;
      acceptStockNow: boolean;
    }
  ): LocalProduct {
    let existing = this.data.products.find(
      (p) => p.id === productId || p.baseSku === productId
    );
    if (!existing) {
      for (const p of this.data.products) {
        if (p.variants.some((v) => v.id === productId || v.sku === productId)) {
          existing = p;
          break;
        }
      }
    }
    if (!existing) {
      throw new Error(`Product '${productId}' not found in fallback store`);
    }
    existing.status = data.acceptStockNow && data.finalQty > 0 ? 'STOCK_STORED' : 'APPROVED';
    existing.updatedAt = new Date().toISOString();
    for (const v of existing.variants) {
      v.defaultBinCode = data.binCode;
      if (v.inventoryItems && v.inventoryItems[0]) {
        v.inventoryItems[0].quantityAvailable = data.finalQty;
      }
    }
    this.saveData();
    return existing;
  }

  acceptStock(
    productId: string,
    data: {
      quantity: number;
      binCode: string;
      challanOrTracking?: string;
      note?: string;
    }
  ): LocalProduct {
    let existing = this.data.products.find(
      (p) => p.id === productId || p.baseSku === productId
    );
    if (!existing) {
      for (const p of this.data.products) {
        if (p.variants.some((v) => v.id === productId || v.sku === productId)) {
          existing = p;
          break;
        }
      }
    }
    if (!existing) {
      throw new Error(`Product '${productId}' not found in fallback store`);
    }
    existing.status = 'STOCK_STORED';
    existing.updatedAt = new Date().toISOString();
    for (const v of existing.variants) {
      v.defaultBinCode = data.binCode;
      if (v.inventoryItems && v.inventoryItems[0]) {
        v.inventoryItems[0].quantityAvailable = (v.inventoryItems[0].quantityAvailable || 0) + data.quantity;
      }
    }
    this.saveData();
    return existing;
  }

  deleteProduct(productId: string): { deleted: boolean; id: string } {
    let existing = this.data.products.find(
      (p) => p.id === productId || p.baseSku === productId
    );
    if (!existing) {
      for (const p of this.data.products) {
        if (p.variants.some((v) => v.id === productId || v.sku === productId)) {
          existing = p;
          break;
        }
      }
    }
    if (!existing) {
      return { deleted: true, id: productId };
    }
    const totalStock = (existing.variants || []).reduce(
      (sum, v) =>
        sum +
        (v.inventoryItems || []).reduce(
          (s, it) => s + (it.quantityAvailable || 0) + (it.quantityReserved || 0),
          0
        ),
      0
    );
    if (totalStock >= 1) {
      throw new Error(
        `Cannot delete product "${existing.title}": Warehouse currently holds ${totalStock} pcs in stock. Product stock must be 0 before deleting.`
      );
    }
    this.data.products = this.data.products.filter((p) => p.id !== existing!.id);
    this.saveData();
    return { deleted: true, id: existing.id };
  }

  findProducts(merchantId?: string): LocalProduct[] {
    if (!merchantId) return this.data.products;
    const clean = merchantId.trim().toUpperCase();
    return this.data.products.filter(
      (p) =>
        p.merchantId === merchantId ||
        p.merchant?.merchantCode?.toUpperCase() === clean
    );
  }

  findProductById(id: string, merchantId?: string): LocalProduct | null {
    const prod = this.data.products.find((p) => p.id === id || p.baseSku === id);
    if (!prod) return null;
    if (merchantId) {
      const clean = merchantId.trim().toUpperCase();
      if (prod.merchantId !== merchantId && prod.merchant?.merchantCode?.toUpperCase() !== clean) {
        return null;
      }
    }
    return prod;
  }

  // Users
  findUserByEmail(email: string): LocalUser | null {
    const clean = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email.toLowerCase() === clean);
    if (!user) return null;
    if (user.merchantId && !user.merchant) {
      user.merchant = this.findMerchantById(user.merchantId) || undefined;
    }
    return user;
  }

  findUserById(id: string): LocalUser | null {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return null;
    if (user.merchantId && !user.merchant) {
      user.merchant = this.findMerchantById(user.merchantId) || undefined;
    }
    return user;
  }

  // Merchants list
  findMerchants(): LocalMerchant[] {
    return this.data.merchants;
  }
}
