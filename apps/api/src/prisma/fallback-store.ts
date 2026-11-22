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
  category?: string;
  brand?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  weight?: string;
  dimensions?: string;
  imageUrl?: string;
  images: string[];
  status?: string;
  lifecycleStatus: string;
  editState: string;
  isSuspended: boolean;
  suspendedReason?: string;
  suspendedAt?: string;
  rejectionReason?: string;
  approvedById?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  merchant?: { merchantCode: string; businessName: string };
  variants: LocalVariant[];
}

export interface LocalProductApprovalRequest {
  id: string;
  productId: string;
  merchantId: string;
  requestedBy?: string;
  status: string;
  adminId?: string;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface LocalProductEditRequest {
  id: string;
  productId: string;
  merchantId: string;
  requestType: string;
  status: string;
  reason?: string;
  requestedChanges?: Record<string, any>;
  originalSnapshot?: Record<string, any>;
  proposedSnapshot?: Record<string, any>;
  rejectionReason?: string;
  adminId?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface LocalRestockRequest {
  id: string;
  productId: string;
  merchantId: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  receivedQuantity: number;
  estimatedDeliveryDate?: string;
  status: string;
  notes?: string;
  rejectionReason?: string;
  adminId?: string;
  createdAt: string;
  reviewedAt?: string;
  completedAt?: string;
}

export interface LocalReturnRequest {
  id: string;
  productId: string;
  merchantId: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  dispatchedQuantity: number;
  status: string;
  returnReason: string;
  notes?: string;
  courierName?: string;
  trackingNumber?: string;
  rejectionReason?: string;
  adminId?: string;
  createdAt: string;
  reviewedAt?: string;
  completedAt?: string;
}

export interface LocalInventoryTransaction {
  id: string;
  productId: string;
  merchantId: string;
  locationId?: string;
  transactionType: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  performedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface LocalActivityLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  notes?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface LocalInAppNotification {
  id: string;
  recipientRole: string;
  recipientUserId?: string;
  merchantId?: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
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
    approvalRequests: LocalProductApprovalRequest[];
    editRequests: LocalProductEditRequest[];
    restockRequests: LocalRestockRequest[];
    returnRequests: LocalReturnRequest[];
    inventoryTransactions: LocalInventoryTransaction[];
    activityLogs: LocalActivityLog[];
    notifications: LocalInAppNotification[];
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
        const parsed = JSON.parse(raw);
        parsed.approvalRequests = parsed.approvalRequests || [];
        parsed.editRequests = parsed.editRequests || [];
        parsed.restockRequests = parsed.restockRequests || [];
        parsed.returnRequests = parsed.returnRequests || [];
        parsed.inventoryTransactions = parsed.inventoryTransactions || [];
        parsed.activityLogs = parsed.activityLogs || [];
        parsed.notifications = parsed.notifications || [];
        return parsed;
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
      approvalRequests: [],
      editRequests: [],
      restockRequests: [],
      returnRequests: [],
      inventoryTransactions: [],
      activityLogs: [],
      notifications: [],
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
    category?: string;
    brand?: string;
    purchasePrice?: number;
    sellingPrice?: number;
    weight?: string;
    dimensions?: string;
    imageUrl?: string;
    images?: string[];
    status?: string;
    saveAsDraft?: boolean;
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

    const isDraft = data.saveAsDraft === true || data.status === 'DRAFT';
    const lifecycleStatus = isDraft ? 'DRAFT' : 'PENDING_APPROVAL';

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
          quantityAvailable: 0, // In strict WMS, initial physical stock is 0 until received into warehouse!
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
      category: data.category || 'General',
      brand: data.brand,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice ?? (data.variants[0]?.price || 0),
      weight: data.weight,
      dimensions: data.dimensions,
      imageUrl: data.imageUrl,
      images: data.images || (data.imageUrl ? [data.imageUrl] : []),
      status: isDraft ? 'DRAFT' : 'PENDING_APPROVAL',
      lifecycleStatus,
      editState: 'NONE',
      isSuspended: false,
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

    if (!isDraft) {
      const approvalReq: LocalProductApprovalRequest = {
        id: `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: prodId,
        merchantId: merchant.id,
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      };
      this.data.approvalRequests.unshift(approvalReq);
      this.createNotification(
        'SUPER_ADMIN',
        undefined,
        merchant.id,
        'New Product Submission',
        `Merchant ${merchant.businessName} submitted product "${newProduct.title}" for approval.`,
        'PRODUCT_SUBMITTED',
        `/admin/products?tab=APPROVAL`
      );
    }

    this.logActivity(
      isDraft ? 'PRODUCT_DRAFT_CREATED' : 'PRODUCT_SUBMITTED_FOR_APPROVAL',
      'PRODUCT',
      prodId,
      undefined,
      undefined,
      { title: newProduct.title, sku: newProduct.baseSku },
      isDraft ? 'Product saved as Draft' : 'Product submitted for Admin Approval'
    );

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
      return this.createProductWithVariants({
        merchantId,
        title: data.title || 'Product',
        description: data.description,
        baseSku: data.baseSku || productId,
        imageUrl: data.imageUrl,
        images: data.images,
        status: data.status || 'DRAFT',
        defaultLocationId: 'loc-a01-01',
        variants: data.variants || [],
      });
    }

    const prevValues = { ...existing };
    const isStatusOnlyUpdate =
      data.title === undefined &&
      data.variants === undefined &&
      data.description === undefined &&
      data.status !== undefined;

    const existingLifecycle = existing.lifecycleStatus || existing.status || 'DRAFT';
    const isDraft = existingLifecycle === 'DRAFT';
    const isPending = existingLifecycle === 'PENDING_APPROVAL';
    const existingTotalStock = (existing.variants || []).reduce(
      (sum, v) =>
        sum + (v.inventoryItems || []).reduce((s, it) => s + (it.quantityAvailable || 0), 0),
      0
    );
    const hasApprovedBin = (existing.variants || []).some(
      (v) =>
        v.defaultBinCode &&
        v.defaultBinCode !== 'Pending Approval' &&
        v.defaultBinCode !== 'Assigned on intake'
    );
    const isAccepted =
      existingLifecycle === 'APPROVED' || existingLifecycle === 'STOCK_STORED' || hasApprovedBin;

    // Rule: "after admin accept the request mercent can not edit and draft product"
    if (data.status === 'DRAFT' && isAccepted) {
      throw new Error(
        `Action Blocked: Cannot move product '${existing.title}' to Draft. After warehouse admin accepts a product, it cannot be drafted or directly edited.`
      );
    }

    if (!isStatusOnlyUpdate) {
      // Rule: Merchant can edit in Draft or during initial Pending Approval (stock = 0).
      // Cannot directly edit approved/stocked product!
      if (isAccepted || (!isDraft && (!isPending || existingTotalStock > 0))) {
        throw new Error(
          existingTotalStock > 0
            ? `Cannot directly edit product '${existing.title}': Product already has ${existingTotalStock} pcs stored in warehouse. Please use Request Edit.`
            : isAccepted
            ? `Action Blocked: Cannot edit product '${existing.title}'. After warehouse admin accepts a product, it cannot be drafted or directly edited.`
            : `Cannot directly edit product '${existing.title}': Editing is only permitted during Draft or initial Pending Approval stage (current status: ${existingLifecycle}).`
        );
      }
    }

    if (data.title) existing.title = data.title;
    if (data.description !== undefined) existing.description = data.description;
    if (data.category) existing.category = data.category;
    if (data.brand !== undefined) existing.brand = data.brand;
    if (data.purchasePrice !== undefined) existing.purchasePrice = data.purchasePrice;
    if (data.sellingPrice !== undefined) existing.sellingPrice = data.sellingPrice;
    if (data.weight !== undefined) existing.weight = data.weight;
    if (data.dimensions !== undefined) existing.dimensions = data.dimensions;
    if (data.baseSku) existing.baseSku = data.baseSku;
    if (data.imageUrl !== undefined) existing.imageUrl = data.imageUrl;
    if (data.images !== undefined) existing.images = data.images;
    if (data.status !== undefined) existing.status = data.status;
    if (data.lifecycleStatus !== undefined) existing.lifecycleStatus = data.lifecycleStatus;
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
        inventoryItems: existing!.variants[idx]?.inventoryItems || [
          {
            id: `item-${existing!.id}-${idx}`,
            locationId: 'loc-a01-01',
            quantityAvailable: 0,
            quantityReserved: 0,
            quantityDamaged: 0,
          },
        ],
      }));
    }

    this.logActivity(
      'PRODUCT_UPDATED',
      'PRODUCT',
      existing.id,
      undefined,
      prevValues,
      existing,
      'Product details updated'
    );

    this.saveData();
    return existing;
  }

  // Legacy compatibility helpers
  approveProduct(
    productId: string,
    data: { binCode: string; finalQty: number; acceptStockNow: boolean }
  ): LocalProduct {
    if (data.acceptStockNow && data.finalQty > 0) {
      this.approveSubmission(productId, 'admin', data.binCode);
      return this.receiveInitialStock(productId, {
        expectedQuantity: data.finalQty,
        actualQuantity: data.finalQty,
        acceptedQuantity: data.finalQty,
        damagedQuantity: 0,
        binCode: data.binCode,
      });
    }
    return this.approveSubmission(productId, 'admin', data.binCode);
  }

  acceptStock(
    productId: string,
    data: { quantity: number; binCode: string; challanOrTracking?: string; note?: string }
  ): LocalProduct {
    return this.receiveInitialStock(productId, {
      expectedQuantity: data.quantity,
      actualQuantity: data.quantity,
      acceptedQuantity: data.quantity,
      damagedQuantity: 0,
      binCode: data.binCode,
      receivingNotes: data.note,
    });
  }

  // ============================================================================
  // WORKFLOW 1: SUBMIT DRAFT FOR APPROVAL
  // ============================================================================
  submitApprovalRequest(productId: string, requestedBy?: string): LocalProduct {
    const p = this.findProductById(productId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    if (p.lifecycleStatus !== 'DRAFT') {
      throw new Error(`Only Draft products can be submitted for approval (current status: ${p.lifecycleStatus})`);
    }

    p.lifecycleStatus = 'PENDING_APPROVAL';
    p.status = 'PENDING_APPROVAL';
    p.updatedAt = new Date().toISOString();

    const req: LocalProductApprovalRequest = {
      id: `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: p.id,
      merchantId: p.merchantId,
      requestedBy,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };
    this.data.approvalRequests.unshift(req);

    this.createNotification(
      'SUPER_ADMIN',
      undefined,
      p.merchantId,
      'New Product Submission',
      `Merchant submitted product "${p.title}" (${p.baseSku}) for review.`,
      'APPROVAL_REQUEST',
      `/admin/products?tab=APPROVAL`
    );

    this.logActivity(
      'SUBMIT_FOR_APPROVAL',
      'PRODUCT',
      p.id,
      requestedBy,
      { status: 'DRAFT' },
      { status: 'PENDING_APPROVAL' },
      'Merchant submitted product for admin approval'
    );

    this.saveData();
    return p;
  }

  // ============================================================================
  // WORKFLOW 2: CANCEL APPROVAL / SUBMISSION (Returns to Draft, Never Deletes!)
  // ============================================================================
  cancelApprovalRequest(productId: string, merchantId?: string): LocalProduct {
    const p = this.findProductById(productId, merchantId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    if (p.lifecycleStatus !== 'PENDING_APPROVAL' && p.lifecycleStatus !== 'AWAITING_STOCK') {
      throw new Error(`Cannot cancel approval for product with status '${p.lifecycleStatus}'`);
    }

    const prevStatus = p.lifecycleStatus;
    p.lifecycleStatus = 'DRAFT';
    p.status = 'DRAFT';
    p.updatedAt = new Date().toISOString();

    // Mark pending approval request as CANCELLED
    const pendingReq = this.data.approvalRequests.find(
      (r) => r.productId === p.id && r.status === 'PENDING'
    );
    if (pendingReq) {
      pendingReq.status = 'CANCELLED';
      pendingReq.reviewedAt = new Date().toISOString();
    }

    this.logActivity(
      'CANCEL_APPROVAL_REQUEST',
      'PRODUCT',
      p.id,
      undefined,
      { status: prevStatus },
      { status: 'DRAFT' },
      'Merchant cancelled approval request; returned to Draft'
    );

    this.saveData();
    return p;
  }

  // ============================================================================
  // WORKFLOW 3: ADMIN APPROVE PRODUCT (Moves to Awaiting Stock)
  // ============================================================================
  approveSubmission(
    productId: string,
    adminId?: string,
    binCode?: string
  ): LocalProduct {
    const p = this.findProductById(productId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    if (p.lifecycleStatus !== 'PENDING_APPROVAL') {
      throw new Error(`Cannot approve product in status '${p.lifecycleStatus}' (must be PENDING_APPROVAL)`);
    }

    const assignedBin = binCode || 'A-01-01';
    p.lifecycleStatus = 'AWAITING_STOCK';
    p.status = 'AWAITING_STOCK';
    p.approvedById = adminId;
    p.approvedAt = new Date().toISOString();
    p.updatedAt = new Date().toISOString();

    for (const v of p.variants) {
      v.defaultBinCode = assignedBin;
    }

    const pendingReq = this.data.approvalRequests.find(
      (r) => r.productId === p.id && r.status === 'PENDING'
    );
    if (pendingReq) {
      pendingReq.status = 'APPROVED';
      pendingReq.adminId = adminId;
      pendingReq.reviewedAt = new Date().toISOString();
    }

    this.createNotification(
      'MERCHANT',
      undefined,
      p.merchantId,
      'Product Approved',
      `Your product "${p.title}" was approved! Please deliver inventory to warehouse bin ${assignedBin}.`,
      'PRODUCT_APPROVED',
      `/merchant/products/${p.id}`
    );

    this.logActivity(
      'APPROVE_PRODUCT_SUBMISSION',
      'PRODUCT',
      p.id,
      adminId,
      { status: 'PENDING_APPROVAL' },
      { status: 'AWAITING_STOCK', binCode: assignedBin },
      'Admin approved product; awaiting physical inventory delivery'
    );

    this.saveData();
    return p;
  }

  // ============================================================================
  // WORKFLOW 4: ADMIN REJECT PRODUCT SUBMISSION
  // ============================================================================
  rejectSubmission(
    productId: string,
    adminId?: string,
    reason?: string
  ): LocalProduct {
    const p = this.findProductById(productId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is strictly required when rejecting a submission');
    }

    p.lifecycleStatus = 'REJECTED';
    p.status = 'REJECTED';
    p.rejectionReason = reason;
    p.updatedAt = new Date().toISOString();

    const pendingReq = this.data.approvalRequests.find(
      (r) => r.productId === p.id && r.status === 'PENDING'
    );
    if (pendingReq) {
      pendingReq.status = 'REJECTED';
      pendingReq.adminId = adminId;
      pendingReq.rejectionReason = reason;
      pendingReq.reviewedAt = new Date().toISOString();
    }

    this.createNotification(
      'MERCHANT',
      undefined,
      p.merchantId,
      'Product Submission Rejected',
      `Your product "${p.title}" was rejected: ${reason}`,
      'PRODUCT_REJECTED',
      `/merchant/products/${p.id}`
    );

    this.logActivity(
      'REJECT_PRODUCT_SUBMISSION',
      'PRODUCT',
      p.id,
      adminId,
      { status: 'PENDING_APPROVAL' },
      { status: 'REJECTED', reason },
      `Admin rejected product submission: ${reason}`
    );

    this.saveData();
    return p;
  }

  // ============================================================================
  // WORKFLOW 5: RECEIVE INITIAL PHYSICAL STOCK (Awaiting Stock -> Active)
  // ============================================================================
  receiveInitialStock(
    productId: string,
    data: {
      expectedQuantity: number;
      actualQuantity: number;
      acceptedQuantity: number;
      damagedQuantity: number;
      warehouseLocation?: string;
      binCode: string;
      receivingNotes?: string;
      receivedBy?: string;
    }
  ): LocalProduct {
    const p = this.findProductById(productId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    if (p.lifecycleStatus !== 'AWAITING_STOCK' && p.lifecycleStatus !== 'ACTIVE') {
      throw new Error(
        `Cannot receive stock for product in status '${p.lifecycleStatus}'. Product must pass Admin Approval first!`
      );
    }

    if (data.acceptedQuantity + data.damagedQuantity > data.actualQuantity) {
      throw new Error('Accepted quantity + damaged quantity cannot exceed actual received quantity');
    }

    const assignedBin = data.binCode || 'A-01-01';
    const loc = this.upsertLocation({
      zone: assignedBin.split('-')[0] || 'A',
      aisle: assignedBin.split('-')[1] || '01',
      rack: assignedBin.split('-')[2] || '01',
      shelf: '01',
      binCode: assignedBin,
    });

    if (data.acceptedQuantity > 0) {
      p.lifecycleStatus = 'ACTIVE';
      p.status = 'STOCK_STORED';

      for (const v of p.variants) {
        v.defaultBinCode = assignedBin;
        if (v.inventoryItems && v.inventoryItems[0]) {
          v.inventoryItems[0].quantityAvailable =
            (v.inventoryItems[0].quantityAvailable || 0) + data.acceptedQuantity;
          v.inventoryItems[0].quantityDamaged =
            (v.inventoryItems[0].quantityDamaged || 0) + data.damagedQuantity;
          v.inventoryItems[0].location = loc;
        }
      }

      // Record immutable InventoryTransaction
      const txn: LocalInventoryTransaction = {
        id: `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: p.id,
        merchantId: p.merchantId,
        locationId: loc.id,
        transactionType: 'INITIAL_STOCK_IN',
        quantity: data.acceptedQuantity,
        referenceType: 'STOCK_RECEIVING',
        performedBy: data.receivedBy,
        notes: data.receivingNotes || `Received ${data.acceptedQuantity} pcs into bin ${assignedBin}`,
        createdAt: new Date().toISOString(),
      };
      this.data.inventoryTransactions.unshift(txn);

      this.createNotification(
        'MERCHANT',
        undefined,
        p.merchantId,
        'Stock Received — Product Active',
        `Warehouse accepted ${data.acceptedQuantity} pcs of "${p.title}". The product is now Active!`,
        'STOCK_RECEIVED',
        `/merchant/products/${p.id}`
      );
    } else {
      // 0 units accepted -> remains Awaiting Stock
      p.lifecycleStatus = 'AWAITING_STOCK';
      p.status = 'AWAITING_STOCK';
    }

    p.updatedAt = new Date().toISOString();

    this.logActivity(
      'STOCK_RECEIVED',
      'PRODUCT',
      p.id,
      data.receivedBy,
      undefined,
      { accepted: data.acceptedQuantity, damaged: data.damagedQuantity, bin: assignedBin },
      data.receivingNotes || `Intake confirmed: ${data.acceptedQuantity} accepted into ${assignedBin}`
    );

    this.saveData();
    return p;
  }

  // ============================================================================
  // WORKFLOW 6: PRODUCT EDIT REQUEST WORKFLOW
  // ============================================================================
  requestEditAccess(productId: string, merchantId?: string, reason?: string): LocalProduct {
    const p = this.findProductById(productId, merchantId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    if (p.lifecycleStatus !== 'ACTIVE') {
      throw new Error(`Can only request edit access for Active products (current status: ${p.lifecycleStatus})`);
    }

    if (p.editState === 'EDIT_REQUESTED' || p.editState === 'EDIT_APPROVAL_PENDING') {
      throw new Error(`An edit request is already pending for product '${p.title}'`);
    }

    p.editState = 'EDIT_REQUESTED';
    p.updatedAt = new Date().toISOString();

    const req: LocalProductEditRequest = {
      id: `edit-req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: p.id,
      merchantId: p.merchantId,
      requestType: 'EDIT_PERMISSION',
      status: 'PENDING',
      reason,
      originalSnapshot: {
        title: p.title,
        description: p.description,
        category: p.category,
        brand: p.brand,
        sellingPrice: p.sellingPrice,
        purchasePrice: p.purchasePrice,
        weight: p.weight,
        dimensions: p.dimensions,
        imageUrl: p.imageUrl,
        images: p.images,
      },
      createdAt: new Date().toISOString(),
    };
    this.data.editRequests.unshift(req);

    this.createNotification(
      'SUPER_ADMIN',
      undefined,
      p.merchantId,
      'Product Edit Permission Requested',
      `Merchant requested edit permission for Active product "${p.title}".`,
      'EDIT_PERMISSION_REQUEST',
      `/admin/products?tab=EDIT_APPROVAL`
    );

    this.logActivity(
      'REQUEST_EDIT_PERMISSION',
      'PRODUCT',
      p.id,
      undefined,
      { editState: 'NONE' },
      { editState: 'EDIT_REQUESTED', reason },
      'Merchant requested edit access'
    );

    this.saveData();
    return p;
  }

  reviewEditAccess(
    productId: string,
    adminId?: string,
    action: 'GRANT' | 'DENY' = 'GRANT',
    reason?: string
  ): LocalProduct {
    const p = this.findProductById(productId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    const pendingReq = this.data.editRequests.find(
      (r) => r.productId === p.id && r.requestType === 'EDIT_PERMISSION' && r.status === 'PENDING'
    );

    if (action === 'GRANT') {
      p.editState = 'EDIT_ALLOWED';
      if (pendingReq) {
        pendingReq.status = 'APPROVED';
        pendingReq.adminId = adminId;
        pendingReq.reviewedAt = new Date().toISOString();
      }

      this.createNotification(
        'MERCHANT',
        undefined,
        p.merchantId,
        'Edit Permission Granted',
        `Admin granted permission to edit product "${p.title}". You can now submit your revisions.`,
        'EDIT_PERMISSION_GRANTED',
        `/merchant/products/${p.id}/edit`
      );
    } else {
      if (!reason || !reason.trim()) {
        throw new Error('Rejection reason required when denying edit access');
      }
      p.editState = 'NONE';
      if (pendingReq) {
        pendingReq.status = 'REJECTED';
        pendingReq.adminId = adminId;
        pendingReq.rejectionReason = reason;
        pendingReq.reviewedAt = new Date().toISOString();
      }

      this.createNotification(
        'MERCHANT',
        undefined,
        p.merchantId,
        'Edit Request Denied',
        `Admin declined edit request for product "${p.title}": ${reason}`,
        'EDIT_PERMISSION_DENIED',
        `/merchant/products/${p.id}`
      );
    }

    p.updatedAt = new Date().toISOString();

    this.logActivity(
      action === 'GRANT' ? 'GRANT_EDIT_PERMISSION' : 'DENY_EDIT_PERMISSION',
      'PRODUCT',
      p.id,
      adminId,
      { editState: 'EDIT_REQUESTED' },
      { editState: p.editState, reason },
      action === 'GRANT' ? 'Admin granted edit access' : `Admin denied edit access: ${reason}`
    );

    this.saveData();
    return p;
  }

  submitRevision(
    productId: string,
    merchantId?: string,
    proposedSnapshot?: Record<string, any>
  ): LocalProduct {
    const p = this.findProductById(productId, merchantId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    if (p.editState !== 'EDIT_ALLOWED') {
      throw new Error(`Cannot submit revisions unless edit access is granted (current state: ${p.editState})`);
    }

    const originalSnapshot = {
      title: p.title,
      description: p.description,
      category: p.category,
      brand: p.brand,
      sellingPrice: p.sellingPrice,
      purchasePrice: p.purchasePrice,
      weight: p.weight,
      dimensions: p.dimensions,
      imageUrl: p.imageUrl,
      images: p.images,
    };

    p.editState = 'EDIT_APPROVAL_PENDING';
    p.updatedAt = new Date().toISOString();

    const req: LocalProductEditRequest = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: p.id,
      merchantId: p.merchantId,
      requestType: 'REVISION_APPROVAL',
      status: 'PENDING',
      originalSnapshot,
      proposedSnapshot: proposedSnapshot || {},
      createdAt: new Date().toISOString(),
    };
    this.data.editRequests.unshift(req);

    this.createNotification(
      'SUPER_ADMIN',
      undefined,
      p.merchantId,
      'Product Revision Submitted',
      `Merchant submitted proposed revisions for product "${p.title}". Ordering temporarily paused until review.`,
      'REVISION_SUBMITTED',
      `/admin/products?tab=EDIT_APPROVAL`
    );

    this.logActivity(
      'SUBMIT_PRODUCT_REVISION',
      'PRODUCT',
      p.id,
      undefined,
      { editState: 'EDIT_ALLOWED' },
      { editState: 'EDIT_APPROVAL_PENDING', proposed: proposedSnapshot },
      'Merchant submitted proposed product changes for Admin Approval'
    );

    this.saveData();
    return p;
  }

  reviewRevision(
    productId: string,
    adminId?: string,
    action: 'APPROVE' | 'REJECT' = 'APPROVE',
    reason?: string
  ): LocalProduct {
    const p = this.findProductById(productId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    const pendingRev = this.data.editRequests.find(
      (r) => r.productId === p.id && r.requestType === 'REVISION_APPROVAL' && r.status === 'PENDING'
    );

    if (action === 'APPROVE') {
      if (pendingRev?.proposedSnapshot) {
        const snap = pendingRev.proposedSnapshot;
        if (snap.title) p.title = snap.title;
        if (snap.description !== undefined) p.description = snap.description;
        if (snap.category) p.category = snap.category;
        if (snap.brand !== undefined) p.brand = snap.brand;
        if (snap.purchasePrice !== undefined) p.purchasePrice = snap.purchasePrice;
        if (snap.sellingPrice !== undefined) p.sellingPrice = snap.sellingPrice;
        if (snap.weight !== undefined) p.weight = snap.weight;
        if (snap.dimensions !== undefined) p.dimensions = snap.dimensions;
        if (snap.imageUrl) p.imageUrl = snap.imageUrl;
        if (snap.images) p.images = snap.images;
      }

      p.editState = 'NONE';
      if (pendingRev) {
        pendingRev.status = 'APPROVED';
        pendingRev.adminId = adminId;
        pendingRev.reviewedAt = new Date().toISOString();
      }

      this.createNotification(
        'MERCHANT',
        undefined,
        p.merchantId,
        'Revision Approved',
        `Admin approved your revisions for product "${p.title}". Ordering is now active!`,
        'REVISION_APPROVED',
        `/merchant/products/${p.id}`
      );
    } else {
      if (!reason || !reason.trim()) {
        throw new Error('Rejection reason required when rejecting product revision');
      }
      p.editState = 'NONE';
      if (pendingRev) {
        pendingRev.status = 'REJECTED';
        pendingRev.adminId = adminId;
        pendingRev.rejectionReason = reason;
        pendingRev.reviewedAt = new Date().toISOString();
      }

      this.createNotification(
        'MERCHANT',
        undefined,
        p.merchantId,
        'Revision Rejected',
        `Admin rejected revisions for "${p.title}": ${reason}. Original details preserved.`,
        'REVISION_REJECTED',
        `/merchant/products/${p.id}`
      );
    }

    p.updatedAt = new Date().toISOString();

    this.logActivity(
      action === 'APPROVE' ? 'APPROVE_PRODUCT_REVISION' : 'REJECT_PRODUCT_REVISION',
      'PRODUCT',
      p.id,
      adminId,
      { editState: 'EDIT_APPROVAL_PENDING' },
      { editState: 'NONE', action, reason },
      action === 'APPROVE'
        ? 'Admin approved product revisions; updated metadata without touching stock'
        : `Admin rejected revisions: ${reason}`
    );

    this.saveData();
    return p;
  }

  // ============================================================================
  // WORKFLOW 7: RESTOCK REQUEST WORKFLOW
  // ============================================================================
  createRestockRequest(
    productId: string,
    merchantId: string,
    data: {
      requestedQuantity: number;
      estimatedDeliveryDate?: string;
      notes?: string;
    }
  ): LocalRestockRequest {
    const p = this.findProductById(productId, merchantId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    if (data.requestedQuantity <= 0) {
      throw new Error('Requested restock quantity must be greater than 0');
    }

    const req: LocalRestockRequest = {
      id: `rstk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: p.id,
      merchantId: p.merchantId,
      requestedQuantity: data.requestedQuantity,
      receivedQuantity: 0,
      estimatedDeliveryDate: data.estimatedDeliveryDate,
      status: 'REQUESTED',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    this.data.restockRequests.unshift(req);

    this.createNotification(
      'SUPER_ADMIN',
      undefined,
      p.merchantId,
      'Restock Request Received',
      `Merchant requested restock of ${data.requestedQuantity} pcs for product "${p.title}".`,
      'RESTOCK_REQUESTED',
      `/admin/inventory?tab=RESTOCK`
    );

    this.logActivity(
      'REQUEST_RESTOCK',
      'RESTOCK_REQUEST',
      req.id,
      undefined,
      undefined,
      { productId: p.id, requestedQuantity: data.requestedQuantity },
      `Merchant requested restock of ${data.requestedQuantity} pcs`
    );

    this.saveData();
    return req;
  }

  reviewRestockRequest(
    requestId: string,
    adminId?: string,
    action: 'APPROVE' | 'REJECT' = 'APPROVE',
    approvedQuantity?: number,
    rejectionReason?: string
  ): LocalRestockRequest {
    const req = this.data.restockRequests.find((r) => r.id === requestId);
    if (!req) throw new Error(`Restock request '${requestId}' not found`);

    const p = this.findProductById(req.productId);

    if (action === 'APPROVE') {
      const finalApproved = approvedQuantity !== undefined ? approvedQuantity : req.requestedQuantity;
      if (finalApproved <= 0) throw new Error('Approved restock quantity must be greater than 0');

      req.status = 'APPROVED';
      req.approvedQuantity = finalApproved;
      req.adminId = adminId;
      req.reviewedAt = new Date().toISOString();

      if (p) {
        this.createNotification(
          'MERCHANT',
          undefined,
          p.merchantId,
          'Restock Approved',
          `Restock of ${finalApproved} pcs for "${p.title}" approved! Delivery instructions available.`,
          'RESTOCK_APPROVED',
          `/merchant/products/${p.id}`
        );
      }
    } else {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error('Rejection reason required when rejecting restock');
      }
      req.status = 'REJECTED';
      req.adminId = adminId;
      req.rejectionReason = rejectionReason;
      req.reviewedAt = new Date().toISOString();

      if (p) {
        this.createNotification(
          'MERCHANT',
          undefined,
          p.merchantId,
          'Restock Rejected',
          `Restock request for "${p.title}" was declined: ${rejectionReason}`,
          'RESTOCK_REJECTED',
          `/merchant/products/${p.id}`
        );
      }
    }

    this.logActivity(
      action === 'APPROVE' ? 'APPROVE_RESTOCK' : 'REJECT_RESTOCK',
      'RESTOCK_REQUEST',
      req.id,
      adminId,
      undefined,
      { status: req.status, approvedQuantity: req.approvedQuantity, reason: rejectionReason },
      action === 'APPROVE'
        ? `Admin approved restock: ${req.approvedQuantity} pcs`
        : `Admin rejected restock: ${rejectionReason}`
    );

    this.saveData();
    return req;
  }

  receiveRestockStock(
    requestId: string,
    adminId: string,
    data: {
      actualQuantity: number;
      acceptedQuantity: number;
      damagedQuantity: number;
      binCode: string;
      receivingNotes?: string;
      receivedBy?: string;
    }
  ): { product: LocalProduct; request: LocalRestockRequest } {
    const req = this.data.restockRequests.find((r) => r.id === requestId);
    if (!req) throw new Error(`Restock request '${requestId}' not found`);

    if (req.status !== 'APPROVED' && req.status !== 'PARTIALLY_RECEIVED') {
      throw new Error(`Cannot receive stock against restock request in status '${req.status}'`);
    }

    const p = this.findProductById(req.productId);
    if (!p) throw new Error(`Product '${req.productId}' not found`);

    const maxAllowed = (req.approvedQuantity || req.requestedQuantity) - req.receivedQuantity;
    if (data.acceptedQuantity > maxAllowed) {
      throw new Error(
        `Accepted quantity (${data.acceptedQuantity}) exceeds approved outstanding quantity (${maxAllowed})`
      );
    }

    const assignedBin = data.binCode || 'A-01-01';
    const loc = this.upsertLocation({
      zone: assignedBin.split('-')[0] || 'A',
      aisle: assignedBin.split('-')[1] || '01',
      rack: assignedBin.split('-')[2] || '01',
      shelf: '01',
      binCode: assignedBin,
    });

    // Add accepted units to EXISTING inventory (never create duplicate product!)
    for (const v of p.variants) {
      v.defaultBinCode = assignedBin;
      if (v.inventoryItems && v.inventoryItems[0]) {
        v.inventoryItems[0].quantityAvailable =
          (v.inventoryItems[0].quantityAvailable || 0) + data.acceptedQuantity;
        v.inventoryItems[0].quantityDamaged =
          (v.inventoryItems[0].quantityDamaged || 0) + data.damagedQuantity;
        v.inventoryItems[0].location = loc;
      }
    }

    req.receivedQuantity += data.acceptedQuantity;
    const totalApproved = req.approvedQuantity || req.requestedQuantity;
    req.status = req.receivedQuantity >= totalApproved ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
    if (req.status === 'COMPLETED') req.completedAt = new Date().toISOString();

    // Create RESTOCK_IN transaction
    const txn: LocalInventoryTransaction = {
      id: `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: p.id,
      merchantId: p.merchantId,
      locationId: loc.id,
      transactionType: 'RESTOCK_IN',
      quantity: data.acceptedQuantity,
      referenceType: 'RESTOCK_REQUEST',
      referenceId: req.id,
      performedBy: data.receivedBy || adminId,
      notes: data.receivingNotes || `Restock accepted: ${data.acceptedQuantity} pcs into bin ${assignedBin}`,
      createdAt: new Date().toISOString(),
    };
    this.data.inventoryTransactions.unshift(txn);

    this.createNotification(
      'MERCHANT',
      undefined,
      p.merchantId,
      'Restock Received',
      `Warehouse received ${data.acceptedQuantity} restock units for "${p.title}".`,
      'RESTOCK_RECEIVED',
      `/merchant/products/${p.id}`
    );

    this.logActivity(
      'RECEIVE_RESTOCK',
      'RESTOCK_REQUEST',
      req.id,
      adminId,
      undefined,
      { acceptedQuantity: data.acceptedQuantity, bin: assignedBin },
      `Received restock of ${data.acceptedQuantity} pcs into existing inventory`
    );

    this.saveData();
    return { product: p, request: req };
  }

  // ============================================================================
  // WORKFLOW 8: RETURN TO MERCHANT WORKFLOW
  // ============================================================================
  createReturnRequest(
    productId: string,
    merchantId: string,
    data: {
      requestedQuantity: number;
      returnReason: string;
      notes?: string;
    }
  ): LocalReturnRequest {
    const p = this.findProductById(productId, merchantId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    if (data.requestedQuantity <= 0) {
      throw new Error('Requested return quantity must be greater than 0');
    }

    if (!data.returnReason || !data.returnReason.trim()) {
      throw new Error('Return reason is required');
    }

    const totalStock = (p.variants || []).reduce(
      (sum, v) =>
        sum + (v.inventoryItems || []).reduce((s, it) => s + (it.quantityAvailable || 0), 0),
      0
    );
    const reservedStock = (p.variants || []).reduce(
      (sum, v) =>
        sum + (v.inventoryItems || []).reduce((s, it) => s + (it.quantityReserved || 0), 0),
      0
    );

    // Sum already approved/pending returns for this product
    const pendingReturns = this.data.returnRequests
      .filter((r) => r.productId === p.id && (r.status === 'REQUESTED' || r.status === 'APPROVED'))
      .reduce((sum, r) => sum + ((r.approvedQuantity || r.requestedQuantity) - r.dispatchedQuantity), 0);

    const availableEligible = totalStock - reservedStock - pendingReturns;
    if (data.requestedQuantity > availableEligible) {
      throw new Error(
        `Requested return quantity (${data.requestedQuantity}) exceeds eligible available stock (${Math.max(0, availableEligible)})`
      );
    }

    const req: LocalReturnRequest = {
      id: `ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: p.id,
      merchantId: p.merchantId,
      requestedQuantity: data.requestedQuantity,
      dispatchedQuantity: 0,
      status: 'REQUESTED',
      returnReason: data.returnReason,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    this.data.returnRequests.unshift(req);

    this.createNotification(
      'SUPER_ADMIN',
      undefined,
      p.merchantId,
      'Return Request Created',
      `Merchant requested return of ${data.requestedQuantity} pcs for "${p.title}".`,
      'RETURN_REQUESTED',
      `/admin/inventory?tab=RETURNS`
    );

    this.logActivity(
      'REQUEST_RETURN',
      'RETURN_REQUEST',
      req.id,
      undefined,
      undefined,
      { productId: p.id, quantity: data.requestedQuantity, reason: data.returnReason },
      `Merchant requested return of ${data.requestedQuantity} pcs`
    );

    this.saveData();
    return req;
  }

  reviewReturnRequest(
    requestId: string,
    adminId?: string,
    action: 'APPROVE' | 'REJECT' = 'APPROVE',
    approvedQuantity?: number,
    rejectionReason?: string
  ): LocalReturnRequest {
    const req = this.data.returnRequests.find((r) => r.id === requestId);
    if (!req) throw new Error(`Return request '${requestId}' not found`);

    const p = this.findProductById(req.productId);

    if (action === 'APPROVE') {
      const finalApproved = approvedQuantity !== undefined ? approvedQuantity : req.requestedQuantity;
      if (finalApproved <= 0) throw new Error('Approved return quantity must be greater than 0');

      req.status = 'APPROVED';
      req.approvedQuantity = finalApproved;
      req.adminId = adminId;
      req.reviewedAt = new Date().toISOString();

      if (p) {
        this.createNotification(
          'MERCHANT',
          undefined,
          p.merchantId,
          'Return Request Approved',
          `Return of ${finalApproved} pcs for "${p.title}" was approved. Warehouse will dispatch soon.`,
          'RETURN_APPROVED',
          `/merchant/products/${p.id}`
        );
      }
    } else {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error('Rejection reason required when declining return');
      }
      req.status = 'REJECTED';
      req.adminId = adminId;
      req.rejectionReason = rejectionReason;
      req.reviewedAt = new Date().toISOString();

      if (p) {
        this.createNotification(
          'MERCHANT',
          undefined,
          p.merchantId,
          'Return Request Declined',
          `Return request for "${p.title}" was declined: ${rejectionReason}`,
          'RETURN_REJECTED',
          `/merchant/products/${p.id}`
        );
      }
    }

    this.logActivity(
      action === 'APPROVE' ? 'APPROVE_RETURN' : 'REJECT_RETURN',
      'RETURN_REQUEST',
      req.id,
      adminId,
      undefined,
      { status: req.status, approvedQuantity: req.approvedQuantity, reason: rejectionReason },
      action === 'APPROVE'
        ? `Admin approved return: ${req.approvedQuantity} pcs`
        : `Admin rejected return: ${rejectionReason}`
    );

    this.saveData();
    return req;
  }

  dispatchReturnStock(
    requestId: string,
    adminId: string,
    data: {
      dispatchedQuantity: number;
      courierName?: string;
      trackingNumber?: string;
      notes?: string;
    }
  ): { product: LocalProduct; request: LocalReturnRequest } {
    const req = this.data.returnRequests.find((r) => r.id === requestId);
    if (!req) throw new Error(`Return request '${requestId}' not found`);

    if (req.status !== 'APPROVED' && req.status !== 'PARTIALLY_DISPATCHED') {
      throw new Error(`Cannot dispatch return in status '${req.status}'`);
    }

    const p = this.findProductById(req.productId);
    if (!p) throw new Error(`Product '${req.productId}' not found`);

    const maxAllowed = (req.approvedQuantity || req.requestedQuantity) - req.dispatchedQuantity;
    if (data.dispatchedQuantity > maxAllowed) {
      throw new Error(
        `Dispatched quantity (${data.dispatchedQuantity}) exceeds approved outstanding quantity (${maxAllowed})`
      );
    }

    // Deduct stock only when physical dispatch is confirmed!
    let qtyToDeduct = data.dispatchedQuantity;
    for (const v of p.variants) {
      for (const it of v.inventoryItems || []) {
        const canTake = Math.min(it.quantityAvailable || 0, qtyToDeduct);
        it.quantityAvailable -= canTake;
        qtyToDeduct -= canTake;
        if (qtyToDeduct <= 0) break;
      }
      if (qtyToDeduct <= 0) break;
    }

    req.dispatchedQuantity += data.dispatchedQuantity;
    if (data.courierName) req.courierName = data.courierName;
    if (data.trackingNumber) req.trackingNumber = data.trackingNumber;

    const totalApproved = req.approvedQuantity || req.requestedQuantity;
    req.status = req.dispatchedQuantity >= totalApproved ? 'DISPATCHED' : 'PARTIALLY_DISPATCHED';
    if (req.status === 'DISPATCHED') req.completedAt = new Date().toISOString();

    // Create RETURN_TO_MERCHANT transaction
    const txn: LocalInventoryTransaction = {
      id: `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: p.id,
      merchantId: p.merchantId,
      transactionType: 'RETURN_TO_MERCHANT',
      quantity: data.dispatchedQuantity,
      referenceType: 'RETURN_DISPATCH',
      referenceId: req.id,
      performedBy: adminId,
      notes: data.notes || `Dispatched ${data.dispatchedQuantity} pcs via ${data.courierName || 'Courier'} (Trk: ${data.trackingNumber || 'N/A'})`,
      createdAt: new Date().toISOString(),
    };
    this.data.inventoryTransactions.unshift(txn);

    this.createNotification(
      'MERCHANT',
      undefined,
      p.merchantId,
      'Return Dispatched',
      `Warehouse dispatched ${data.dispatchedQuantity} pcs of "${p.title}" via ${data.courierName || 'Courier'}.`,
      'RETURN_DISPATCHED',
      `/merchant/products/${p.id}`
    );

    this.logActivity(
      'DISPATCH_RETURN',
      'RETURN_REQUEST',
      req.id,
      adminId,
      undefined,
      { dispatchedQuantity: data.dispatchedQuantity, courier: data.courierName, tracking: data.trackingNumber },
      `Confirmed physical return dispatch of ${data.dispatchedQuantity} pcs`
    );

    this.saveData();
    return { product: p, request: req };
  }

  // ============================================================================
  // WORKFLOW 9: PRODUCT SUSPENSION & REACTIVATION
  // ============================================================================
  suspendProduct(productId: string, adminId?: string, reason?: string): LocalProduct {
    const p = this.findProductById(productId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    if (!reason || !reason.trim()) {
      throw new Error('Suspension reason required');
    }

    p.isSuspended = true;
    p.suspendedReason = reason;
    p.suspendedAt = new Date().toISOString();
    p.updatedAt = new Date().toISOString();

    this.createNotification(
      'MERCHANT',
      undefined,
      p.merchantId,
      'Product Suspended',
      `Your product "${p.title}" was suspended by admin: ${reason}`,
      'PRODUCT_SUSPENDED',
      `/merchant/products/${p.id}`
    );

    this.logActivity(
      'SUSPEND_PRODUCT',
      'PRODUCT',
      p.id,
      adminId,
      { isSuspended: false },
      { isSuspended: true, reason },
      `Admin suspended product: ${reason}`
    );

    this.saveData();
    return p;
  }

  reactivateProduct(productId: string, adminId?: string): LocalProduct {
    const p = this.findProductById(productId);
    if (!p) throw new Error(`Product '${productId}' not found`);

    p.isSuspended = false;
    p.suspendedReason = undefined;
    p.suspendedAt = undefined;
    p.updatedAt = new Date().toISOString();

    this.createNotification(
      'MERCHANT',
      undefined,
      p.merchantId,
      'Product Reactivated',
      `Your product "${p.title}" has been reactivated and is eligible for ordering.`,
      'PRODUCT_REACTIVATED',
      `/merchant/products/${p.id}`
    );

    this.logActivity(
      'REACTIVATE_PRODUCT',
      'PRODUCT',
      p.id,
      adminId,
      { isSuspended: true },
      { isSuspended: false },
      'Admin reactivated product'
    );

    this.saveData();
    return p;
  }

  // ============================================================================
  // WORKFLOW 10: DELETE PRODUCT (Guarded by 0 stock and pending requests)
  // ============================================================================
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

    // Also check for pending requests
    const hasPendingApproval = this.data.approvalRequests.some(
      (r) => r.productId === existing!.id && r.status === 'PENDING'
    );
    if (hasPendingApproval) {
      throw new Error(`Cannot delete product "${existing.title}": An approval request is currently pending. Cancel the approval request first.`);
    }

    this.data.products = this.data.products.filter((p) => p.id !== existing!.id);

    this.logActivity(
      'DELETE_PRODUCT',
      'PRODUCT',
      existing.id,
      undefined,
      existing,
      undefined,
      `Product "${existing.title}" permanently deleted (stock was 0)`
    );

    this.saveData();
    return { deleted: true, id: existing.id };
  }

  // ============================================================================
  // WORKFLOW 11: ORDERING ELIGIBILITY CHECK (Section 17)
  // ============================================================================
  checkOrderEligibility(productId: string, quantity: number = 1): { eligible: boolean; reason?: string } {
    const p = this.findProductById(productId);
    if (!p) return { eligible: false, reason: 'Product not found' };

    if (p.lifecycleStatus !== 'ACTIVE') {
      return { eligible: false, reason: `Product lifecycle status is '${p.lifecycleStatus}' (must be ACTIVE)` };
    }

    if (p.isSuspended) {
      return { eligible: false, reason: `Product is suspended: ${p.suspendedReason || 'Admin restriction'}` };
    }

    if (p.editState === 'EDIT_APPROVAL_PENDING') {
      return { eligible: false, reason: 'Product is currently undergoing revision review by Admin' };
    }

    const totalStock = (p.variants || []).reduce(
      (sum, v) =>
        sum + (v.inventoryItems || []).reduce((s, it) => s + (it.quantityAvailable || 0), 0),
      0
    );
    const reservedStock = (p.variants || []).reduce(
      (sum, v) =>
        sum + (v.inventoryItems || []).reduce((s, it) => s + (it.quantityReserved || 0), 0),
      0
    );
    const availableStock = totalStock - reservedStock;

    if (availableStock <= 0) {
      return { eligible: false, reason: 'Available stock is 0' };
    }

    if (quantity > availableStock) {
      return { eligible: false, reason: `Requested quantity (${quantity}) exceeds available stock (${availableStock})` };
    }

    return { eligible: true };
  }

  // ============================================================================
  // QUERIES & GETTERS
  // ============================================================================
  findProducts(merchantId?: string): LocalProduct[] {
    if (!merchantId) {
      // Admin Catalog / Approval view: Never show private merchant drafts!
      return this.data.products.filter(
        (p) => p.status !== 'DRAFT' && p.lifecycleStatus !== 'DRAFT'
      );
    }
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

  listApprovalRequests(merchantId?: string, status?: string): LocalProductApprovalRequest[] {
    return this.data.approvalRequests.filter((r) => {
      if (merchantId && r.merchantId !== merchantId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }

  listEditRequests(merchantId?: string, status?: string): LocalProductEditRequest[] {
    return this.data.editRequests.filter((r) => {
      if (merchantId && r.merchantId !== merchantId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }

  listRestockRequests(merchantId?: string, status?: string): LocalRestockRequest[] {
    return this.data.restockRequests.filter((r) => {
      if (merchantId && r.merchantId !== merchantId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }

  listReturnRequests(merchantId?: string, status?: string): LocalReturnRequest[] {
    return this.data.returnRequests.filter((r) => {
      if (merchantId && r.merchantId !== merchantId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }

  listInventoryTransactions(productId?: string, merchantId?: string): LocalInventoryTransaction[] {
    return this.data.inventoryTransactions.filter((t) => {
      if (productId && t.productId !== productId) return false;
      if (merchantId && t.merchantId !== merchantId) return false;
      return true;
    });
  }

  // ============================================================================
  // AUDIT LOGS & NOTIFICATIONS
  // ============================================================================
  logActivity(
    action: string,
    entityType: string,
    entityId: string,
    userId?: string,
    previousValues?: any,
    newValues?: any,
    notes?: string
  ): LocalActivityLog {
    const log: LocalActivityLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      action,
      entityType,
      entityId,
      previousValues,
      newValues,
      notes,
      createdAt: new Date().toISOString(),
    };
    this.data.activityLogs.unshift(log);
    this.saveData();
    return log;
  }

  listActivityLogs(entityType?: string, entityId?: string): LocalActivityLog[] {
    return this.data.activityLogs.filter((l) => {
      if (entityType && l.entityType !== entityType) return false;
      if (entityId && l.entityId !== entityId) return false;
      return true;
    });
  }

  createNotification(
    recipientRole: string,
    recipientUserId: string | undefined,
    merchantId: string | undefined,
    title: string,
    message: string,
    type: string,
    linkUrl?: string
  ): LocalInAppNotification {
    const notif: LocalInAppNotification = {
      id: `ntf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientRole,
      recipientUserId,
      merchantId,
      title,
      message,
      type,
      linkUrl,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.saveData();
    return notif;
  }

  listNotifications(role?: string, merchantId?: string, isRead?: boolean): LocalInAppNotification[] {
    return this.data.notifications.filter((n) => {
      if (role && n.recipientRole !== role) return false;
      if (merchantId && n.merchantId && n.merchantId !== merchantId) return false;
      if (isRead !== undefined && n.isRead !== isRead) return false;
      return true;
    });
  }

  markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.saveData();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(role?: string, merchantId?: string): number {
    let count = 0;
    for (const n of this.data.notifications) {
      if (role && n.recipientRole !== role) continue;
      if (merchantId && n.merchantId && n.merchantId !== merchantId) continue;
      if (!n.isRead) {
        n.isRead = true;
        count++;
      }
    }
    if (count > 0) this.saveData();
    return count;
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
