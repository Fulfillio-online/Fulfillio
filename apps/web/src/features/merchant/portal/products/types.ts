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
}

export interface ProductVariantConfig {
  id: string;
  variantSku: string;
  color?: string;
  size?: string;
  attributeName?: string;
  attributeValue?: string;
  stock: number;
}

export type ProductFilterTab =
  | 'ALL'
  | 'PUBLISHED'
  | 'DRAFT'
  | 'OUT_OF_STOCK'
  | 'STOCK_REQUESTS';

export type ProductSortOption =
  | 'NEWEST'
  | 'PRICE_ASC'
  | 'PRICE_DESC'
  | 'STOCK_DESC'
  | 'MARGIN_DESC';

export type ProductViewMode = 'LIST' | 'GRID';

export interface ProductStats {
  storeProducts: number;
  published: number;
  totalOrders: number;
  lowStock: number;
  pendingRequests?: number;
}

export interface StockRequestItem {
  id: string;
  productId: string;
  productTitle: string;
  productSku: string;
  requestedQty: number;
  currentStock: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  note?: string;
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
  onManageStock: (product: MerchantProductItem) => void;
  onViewDetails: (product: MerchantProductItem) => void;
  onEditProduct: (product: MerchantProductItem) => void;
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
}
