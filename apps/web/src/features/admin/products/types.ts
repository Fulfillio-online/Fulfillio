export type WarehouseProductSubTab = 'all' | 'approval' | 'bins';

export interface WarehouseBin {
  code: string;
  description: string;
  zone: string;
  capacityUnits: number;
  createdAt: string;
}

export interface MerchantInfo {
  code: string;
  name: string;
  categoryFocus: string;
}

export interface WarehouseProductItem {
  id: string;
  title: string;
  category: 'Apparel' | 'Footwear' | 'Electronics' | 'Accessories';
  merchantCode: string;
  merchantName: string;
  shortSku: string;
  fullSku: string;
  color: string;
  size: string;
  binCode: string;
  stock: number;
  price: number;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED' | 'DRAFT';
  isDraft?: boolean;
  submittedAt: string;
  imageUrl: string;
}

export interface ProductPresetThumbnail {
  id: string;
  name: string;
  category: string;
  url: string;
}
