import { MerchantProductItem } from '../types';

export type ProductType =
  | 'FASHION'
  | 'ELECTRONICS'
  | 'BEAUTY'
  | 'GROCERY'
  | 'STANDARD';

export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  imageUrl?: string;
  sizes?: string[];
  originalName?: string;
}

export interface ProductVariantConfig {
  id: string;
  variantSku: string;
  color?: string;
  originalColor?: string;
  size?: string;
  originalSize?: string;
  imageUrl?: string;
  attributeName?: string;
  attributeValue?: string;
  stock: number;
}

export type ProductFilterTab =
  | 'ALL'
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'AWAITING_STOCK'
  | 'ACTIVE'
  | 'PUBLISHED'
  | 'EDIT_APPROVAL_PENDING'
  | 'OUT_OF_STOCK'
  | 'REJECTED'
  | 'STOCK_REQUESTS';

export type ProductSortOption =
  | 'NEWEST'
  | 'PRICE_ASC'
  | 'PRICE_DESC'
  | 'STOCK_DESC'
  | 'MARGIN_DESC';

export type ProductViewMode = 'LIST' | 'GRID';

export interface ProductStats {
  totalProducts: number;
  draftProducts: number;
  pendingApproval: number;
  awaitingStock: number;
  activeProducts: number;
  editApprovalPending: number;
  rejected?: number;
  restockRequests: number;
  returnRequests: number;
  totalWarehouseStock: number;
  // Legacy aliases
  storeProducts?: number;
  published?: number;
  totalOrders?: number;
  lowStock?: number;
  outOfStock?: number;
  pendingRequests?: number;
}

export type StockRequestType = 'RESTOCK' | 'RETURN';

export type ManageStockMode = StockRequestType | 'ADJUST';

export interface NewVariantStockInput {
  color?: string;
  hex?: string;
  size?: string;
  attributeName?: string;
  attributeValue?: string;
  price?: number;
  imageUrl?: string;
  stock: number;
}

export interface VariantQuantityAdjustmentInput {
  variantId?: string;
  variantSku?: string;
  color?: string;
  size?: string;
  newQuantity: number;
  reason?: string;
}

export interface ManageVariantsAndStockPayload {
  productId: string;
  newVariants: NewVariantStockInput[];
  adjustments: VariantQuantityAdjustmentInput[];
  reason?: string;
}

export interface StockRequestItem {
  id: string;
  productId: string;
  productTitle: string;
  productSku: string;
  variantSku?: string;
  color?: string;
  size?: string;
  type?: StockRequestType;
  requestedQty: number;
  currentStock: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  note?: string;
  reason?: string;
  destination?: string;
  carrier?: string;
  trackingRef?: string;
  gatePassNo?: string;
  createdAt: string;
  imageUrl?: string;
}

export interface ProductTableProps {
  products: MerchantProductItem[];
  selectedIds: string[];
  merchantCode: string;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onToggleStatus: (id: string) => void;
  onManageStock: (product: MerchantProductItem, initialMode?: ManageStockMode) => void;
  onViewDetails: (product: MerchantProductItem) => void;
  onEditProduct: (product: MerchantProductItem) => void;
  onRequestEdit?: (product: MerchantProductItem) => void;
  onViewPendingEdit?: (product: MerchantProductItem) => void;
  onCancelPendingEdit?: (productId: string) => void;
  onPrintBarcode: (product: MerchantProductItem) => void;
  onRequestDelete: (product: MerchantProductItem) => void;
}

export interface ProductToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  sortOption: ProductSortOption;
  onSortChange: (opt: ProductSortOption) => void;
  viewMode: ProductViewMode;
  onViewModeChange: (mode: ProductViewMode) => void;
  // Admin-style Bulk Actions props
  selectedCount?: number;
  activeTab?: ProductFilterTab;
  onBulkPublish?: () => void;
  onBulkDraft?: () => void;
  onBulkDelete?: () => void;
  onClearSelection?: () => void;
}
