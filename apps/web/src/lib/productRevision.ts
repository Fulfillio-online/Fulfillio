export interface ProductRevisionColor {
  id: string;
  name: string;
  hex: string;
  imageUrl?: string;
  sizes?: string[];
  originalName?: string;
}

export interface ProductRevisionVariant {
  id?: string;
  variantSku?: string;
  sku?: string;
  variantCode?: string;
  title?: string;
  color?: string;
  originalColor?: string;
  hex?: string;
  size?: string;
  originalSize?: string;
  price?: number;
  imageUrl?: string;
  attributeName?: string;
  attributeValue?: string;
  stock?: number;
}

export interface ProductRevisionSnapshot {
  title: string;
  description?: string;
  sku?: string;
  baseSku?: string;
  category?: string;
  subcategory?: string;
  productType?: 'FASHION' | 'ELECTRONICS' | 'BEAUTY' | 'GROCERY' | 'STANDARD' | string;
  price: number;
  costPrice?: number;
  imageUrl?: string;
  images?: string[];
  keyFeatures?: string[];
  colors?: ProductRevisionColor[];
  sizes?: string[];
  variantsList?: ProductRevisionVariant[];
}

export interface ProductPendingEditInfo {
  requestId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  changedFields?: string[];
  originalSnapshot?: ProductRevisionSnapshot;
  proposedSnapshot: ProductRevisionSnapshot;
}

export interface ColorChangeEntry {
  kind: 'MODIFIED' | 'ADDED' | 'REMOVED';
  before?: ProductRevisionColor;
  after?: ProductRevisionColor;
  details: string[];
}

export interface RevisionDiffSummary {
  changedFields: string[];
  scalarChanges: Array<{
    field: string;
    label: string;
    before: string;
    after: string;
  }>;
  colorChanges: ColorChangeEntry[];
  sizeChanges: {
    added: string[];
    removed: string[];
  };
  imageChanges: {
    primaryChanged: boolean;
    beforePrimary?: string;
    afterPrimary?: string;
    addedImages: string[];
    removedImages: string[];
  };
  featureChanges: {
    added: string[];
    removed: string[];
  };
  hasChanges: boolean;
}

function cleanStr(val?: string | null): string {
  return (val || '').trim();
}

function normalizeImageList(primary?: string, images?: string[]): string[] {
  const set = new Set<string>();
  const p = cleanStr(primary);
  if (p) set.add(p);
  if (Array.isArray(images)) {
    for (const img of images) {
      const c = cleanStr(img);
      if (c) set.add(c);
    }
  }
  return Array.from(set);
}

function normalizeStringList(items?: string[]): string[] {
  if (!Array.isArray(items)) return [];
  return Array.from(new Set(items.map((x) => cleanStr(x)).filter(Boolean)));
}

function normalizeColors(colors?: ProductRevisionColor[]): ProductRevisionColor[] {
  if (!Array.isArray(colors)) return [];
  return colors.map((c, idx) => ({
    id: c.id || `c-${idx + 1}`,
    name: cleanStr(c.name) || 'Standard',
    hex: cleanStr(c.hex) || '#111827',
    imageUrl: cleanStr(c.imageUrl) || undefined,
    sizes: Array.isArray(c.sizes) ? c.sizes.map((s) => cleanStr(s)).filter(Boolean) : undefined,
    originalName: cleanStr(c.originalName) || undefined,
  }));
}

function deriveColorsFromApiProduct(apiProduct: any): ProductRevisionColor[] {
  const variants = Array.isArray(apiProduct?.variants) ? apiProduct.variants : [];
  const storedColors = variants[0]?.attributes?.allColors;
  if (Array.isArray(storedColors) && storedColors.length > 0) {
    return normalizeColors(storedColors);
  }
  const colorMap = new Map<string, ProductRevisionColor>();
  for (const v of variants) {
    const colorName = cleanStr(v?.attributes?.color || v?.title?.split('/')?.[0]);
    const sizeName = cleanStr(v?.attributes?.size || v?.title?.split('/')?.[1]);
    const hex = cleanStr(v?.attributes?.hex) || '#111827';
    const img = cleanStr(v?.imageUrl || v?.attributes?.imageUrl) || undefined;
    if (!colorName) continue;
    const key = colorName.toLowerCase();
    if (!colorMap.has(key)) {
      colorMap.set(key, {
        id: `c-${colorMap.size + 1}`,
        name: colorName,
        hex,
        imageUrl: img,
        sizes: sizeName ? [sizeName] : [],
      });
    } else {
      const entry = colorMap.get(key)!;
      if (!entry.imageUrl && img) entry.imageUrl = img;
      if (sizeName && entry.sizes && !entry.sizes.includes(sizeName)) {
        entry.sizes.push(sizeName);
      }
    }
  }
  return Array.from(colorMap.values());
}

/**
 * Extracts pending edit info and latest edit rejection reason from an API product response.
 */
export function extractPendingEditFromApiProduct(apiProduct: any): {
  editState: 'NONE' | 'EDIT_REQUESTED' | 'EDIT_ALLOWED' | 'EDIT_APPROVAL_PENDING' | null;
  pendingEdit: ProductPendingEditInfo | null;
  lastEditRejectionReason?: string;
} {
  const rawEditState = cleanStr(apiProduct?.editState).toUpperCase();
  const editState =
    rawEditState === 'EDIT_APPROVAL_PENDING'
      ? ('EDIT_APPROVAL_PENDING' as const)
      : rawEditState === 'EDIT_REQUESTED'
      ? ('EDIT_REQUESTED' as const)
      : rawEditState === 'EDIT_ALLOWED'
      ? ('EDIT_ALLOWED' as const)
      : rawEditState === 'NONE'
      ? ('NONE' as const)
      : null;

  const editRequests = Array.isArray(apiProduct?.editRequests) ? apiProduct.editRequests : [];
  const revisionRequests = editRequests
    .filter((r: any) => !r.requestType || r.requestType === 'REVISION_APPROVAL')
    .sort((a: any, b: any) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

  const latestPending = revisionRequests.find((r: any) => r.status === 'PENDING');
  const newestRevision = revisionRequests[0];

  if (editState === 'EDIT_APPROVAL_PENDING' && latestPending?.proposedSnapshot) {
    const originalSnapshot: ProductRevisionSnapshot =
      latestPending.originalSnapshot || buildRevisionSnapshotFromApiProduct(apiProduct);
    const proposedSnapshot: ProductRevisionSnapshot = latestPending.proposedSnapshot;
    const changedFields =
      Array.isArray(latestPending.requestedChanges?.changedFields)
        ? latestPending.requestedChanges.changedFields
        : computeRevisionDiff(originalSnapshot, proposedSnapshot).changedFields;

    return {
      editState: 'EDIT_APPROVAL_PENDING',
      pendingEdit: {
        requestId: latestPending.id,
        status: 'PENDING',
        submittedAt: latestPending.createdAt || new Date().toISOString(),
        changedFields,
        originalSnapshot,
        proposedSnapshot,
      },
      lastEditRejectionReason: undefined,
    };
  }

  const lastEditRejectionReason =
    editState !== 'EDIT_APPROVAL_PENDING' &&
    newestRevision?.status === 'REJECTED' &&
    newestRevision?.rejectionReason
      ? String(newestRevision.rejectionReason)
      : undefined;

  return {
    editState,
    pendingEdit: null,
    lastEditRejectionReason,
  };
}

export function buildRevisionSnapshotFromApiProduct(apiProduct: any): ProductRevisionSnapshot {
  const variants = Array.isArray(apiProduct?.variants) ? apiProduct.variants : [];
  const firstVariant = variants[0];
  const minPrice =
    variants.length > 0
      ? Math.min(...variants.map((v: any) => Number(v.price) || 0))
      : Number(apiProduct?.sellingPrice) || 0;
  const colors = deriveColorsFromApiProduct(apiProduct);
  const sizesSet = new Set<string>();
  const variantsList: ProductRevisionVariant[] = variants.map((v: any) => {
    const colorName = cleanStr(v?.attributes?.color || v?.title?.split('/')?.[0]) || 'Standard';
    const sizeName = cleanStr(v?.attributes?.size || v?.title?.split('/')?.[1]) || 'Standard';
    if (sizeName) sizesSet.add(sizeName);
    const phys = v?.inventoryItems?.[0]?.quantityAvailable ?? 0;
    const decl = Number(v?.attributes?.declaredStock ?? v?.attributes?.stock ?? 0);
    return {
      id: v.id,
      variantSku: v.sku,
      sku: v.sku,
      title: v.title,
      color: colorName,
      hex: cleanStr(v?.attributes?.hex) || '#111827',
      size: sizeName,
      price: Number(v.price) || minPrice,
      imageUrl: cleanStr(v.imageUrl || v?.attributes?.imageUrl) || undefined,
      attributeName: v?.attributes?.attributeName,
      attributeValue: v?.attributes?.attributeValue,
      stock: phys > 0 ? phys : decl,
    };
  });

  return {
    title: cleanStr(apiProduct?.title),
    description: cleanStr(apiProduct?.description),
    sku: cleanStr(apiProduct?.baseSku),
    baseSku: cleanStr(apiProduct?.baseSku),
    category: cleanStr(firstVariant?.attributes?.category || apiProduct?.category) || 'Fashion',
    subcategory: cleanStr(firstVariant?.attributes?.subcategory) || 'Apparel',
    productType: firstVariant?.attributes?.productType || 'FASHION',
    price: Number(apiProduct?.sellingPrice) || minPrice || 0,
    costPrice:
      apiProduct?.purchasePrice !== undefined && apiProduct?.purchasePrice !== null
        ? Number(apiProduct.purchasePrice)
        : undefined,
    imageUrl: cleanStr(apiProduct?.imageUrl) || undefined,
    images: normalizeImageList(apiProduct?.imageUrl, apiProduct?.images),
    keyFeatures: Array.isArray(firstVariant?.attributes?.keyFeatures)
      ? firstVariant.attributes.keyFeatures
      : [],
    colors,
    sizes: Array.from(sizesSet),
    variantsList,
  };
}

export function buildRevisionSnapshotFromMerchantProduct(product: any): ProductRevisionSnapshot {
  const colors = normalizeColors(product?.colors);
  const variantsList: ProductRevisionVariant[] = Array.isArray(product?.variantsList)
    ? product.variantsList.map((v: any) => ({
        id: v.id,
        variantSku: v.variantSku || v.sku,
        sku: v.variantSku || v.sku,
        color: cleanStr(v.color) || 'Standard',
        originalColor: cleanStr(v.originalColor) || undefined,
        hex: colors.find((c) => c.name.toLowerCase() === cleanStr(v.color).toLowerCase())?.hex,
        size: cleanStr(v.size) || 'Standard',
        originalSize: cleanStr(v.originalSize) || undefined,
        price: Number(v.price ?? product?.price) || 0,
        imageUrl: cleanStr(v.imageUrl) || undefined,
        attributeName: v.attributeName,
        attributeValue: v.attributeValue,
        stock: Number(v.stock) || 0,
      }))
    : [];

  return {
    title: cleanStr(product?.title),
    description: cleanStr(product?.description),
    sku: cleanStr(product?.sku),
    baseSku: cleanStr(product?.sku),
    category: cleanStr(product?.category) || 'Fashion',
    subcategory: cleanStr(product?.subcategory) || 'Apparel',
    productType: product?.productType || 'FASHION',
    price: Number(product?.price) || 0,
    costPrice: product?.costPrice !== undefined ? Number(product.costPrice) : undefined,
    imageUrl: cleanStr(product?.imageUrl) || undefined,
    images: normalizeImageList(product?.imageUrl, product?.images),
    keyFeatures: normalizeStringList(product?.keyFeatures),
    colors,
    sizes: normalizeStringList(product?.sizes),
    variantsList,
  };
}

export function buildRevisionSnapshotFromWarehouseProduct(product: any): ProductRevisionSnapshot {
  const colors = normalizeColors(
    Array.isArray(product?.colors) && product.colors.length > 0
      ? product.colors
      : product?.color
      ? [{ id: 'c-1', name: product.color, hex: '#111827', sizes: product?.sizes || [product.size || 'Standard'] }]
      : []
  );

  const variantsList: ProductRevisionVariant[] = Array.isArray(product?.variantsList)
    ? product.variantsList.map((v: any) => ({
        id: v.id,
        variantSku: v.variantSku || v.sku,
        sku: v.variantSku || v.sku,
        color: cleanStr(v.color) || cleanStr(product?.color) || 'Standard',
        originalColor: cleanStr(v.originalColor) || undefined,
        size: cleanStr(v.size) || cleanStr(product?.size) || 'Standard',
        originalSize: cleanStr(v.originalSize) || undefined,
        price: Number(product?.price) || 0,
        imageUrl: cleanStr(v.imageUrl) || undefined,
        attributeName: v.attributeName,
        attributeValue: v.attributeValue,
        stock: Number(v.stock) || 0,
      }))
    : [];

  return {
    title: cleanStr(product?.title),
    description: cleanStr(product?.description),
    sku: cleanStr(product?.shortSku || product?.fullSku),
    baseSku: cleanStr(product?.shortSku || product?.fullSku),
    category: cleanStr(product?.category) || 'Fashion',
    subcategory: cleanStr(product?.subcategory),
    productType: product?.productType || 'FASHION',
    price: Number(product?.price) || 0,
    costPrice: product?.costPrice !== undefined ? Number(product.costPrice) : undefined,
    imageUrl: cleanStr(product?.imageUrl) || undefined,
    images: normalizeImageList(product?.imageUrl, product?.images),
    keyFeatures: normalizeStringList(product?.keyFeatures),
    colors,
    sizes: normalizeStringList(product?.sizes),
    variantsList,
  };
}

function matchColorPair(
  beforeList: ProductRevisionColor[],
  afterList: ProductRevisionColor[]
): {
  pairs: Array<{ before?: ProductRevisionColor; after?: ProductRevisionColor }>;
} {
  const matchedBefore = new Set<number>();
  const matchedAfter = new Set<number>();
  const pairs: Array<{ before?: ProductRevisionColor; after?: ProductRevisionColor }> = [];

  // Pass 1: Match by id
  afterList.forEach((after, aIdx) => {
    const bIdx = beforeList.findIndex(
      (b, idx) => !matchedBefore.has(idx) && Boolean(after.id) && b.id === after.id
    );
    if (bIdx >= 0) {
      matchedBefore.add(bIdx);
      matchedAfter.add(aIdx);
      pairs.push({ before: beforeList[bIdx], after });
    }
  });

  // Pass 2: Match by originalName
  afterList.forEach((after, aIdx) => {
    if (matchedAfter.has(aIdx) || !after.originalName) return;
    const origLower = after.originalName.toLowerCase();
    const bIdx = beforeList.findIndex(
      (b, idx) => !matchedBefore.has(idx) && b.name.toLowerCase() === origLower
    );
    if (bIdx >= 0) {
      matchedBefore.add(bIdx);
      matchedAfter.add(aIdx);
      pairs.push({ before: beforeList[bIdx], after });
    }
  });

  // Pass 3: Match by case-insensitive name
  afterList.forEach((after, aIdx) => {
    if (matchedAfter.has(aIdx)) return;
    const nameLower = after.name.toLowerCase();
    const bIdx = beforeList.findIndex(
      (b, idx) => !matchedBefore.has(idx) && b.name.toLowerCase() === nameLower
    );
    if (bIdx >= 0) {
      matchedBefore.add(bIdx);
      matchedAfter.add(aIdx);
      pairs.push({ before: beforeList[bIdx], after });
    }
  });

  // Remaining unmatched
  beforeList.forEach((before, bIdx) => {
    if (!matchedBefore.has(bIdx)) {
      pairs.push({ before });
    }
  });
  afterList.forEach((after, aIdx) => {
    if (!matchedAfter.has(aIdx)) {
      pairs.push({ after });
    }
  });

  return { pairs };
}

/**
 * Computes a structured human-readable diff between an original published snapshot
 * and a proposed revision snapshot.
 */
export function computeRevisionDiff(
  originalInput?: ProductRevisionSnapshot | null,
  proposedInput?: ProductRevisionSnapshot | null
): RevisionDiffSummary {
  const original: ProductRevisionSnapshot = originalInput || { title: '', price: 0 };
  const proposed: ProductRevisionSnapshot = proposedInput || { title: '', price: 0 };

  const changedFields: string[] = [];
  const scalarChanges: RevisionDiffSummary['scalarChanges'] = [];

  const checkScalar = (
    field: string,
    label: string,
    beforeRaw: string | number | undefined,
    afterRaw: string | number | undefined,
    formatter?: (v: any) => string
  ) => {
    const b = beforeRaw === undefined || beforeRaw === null ? '' : String(beforeRaw).trim();
    const a = afterRaw === undefined || afterRaw === null ? '' : String(afterRaw).trim();
    if (b !== a && !(b === '' && a === '')) {
      changedFields.push(label);
      scalarChanges.push({
        field,
        label,
        before: formatter ? formatter(beforeRaw) : b || '—',
        after: formatter ? formatter(afterRaw) : a || '—',
      });
    }
  };

  checkScalar('title', 'Product Title', original.title, proposed.title);
  checkScalar(
    'price',
    'Declare Price',
    Number(original.price) || 0,
    Number(proposed.price) || 0,
    (v) => `৳${(Number(v) || 0).toLocaleString()}`
  );

  if (
    original.costPrice !== undefined &&
    proposed.costPrice !== undefined &&
    Number(original.costPrice) !== Number(proposed.costPrice)
  ) {
    checkScalar(
      'costPrice',
      'Cost Price',
      Number(original.costPrice),
      Number(proposed.costPrice),
      (v) => `৳${(Number(v) || 0).toLocaleString()}`
    );
  }

  checkScalar('category', 'Category', original.category, proposed.category);
  if (proposed.subcategory !== undefined && original.subcategory !== undefined) {
    checkScalar('subcategory', 'Subcategory', original.subcategory, proposed.subcategory);
  }
  checkScalar('description', 'Description', original.description, proposed.description);

  // Colors diff
  const origColors = normalizeColors(original.colors);
  const propColors = normalizeColors(proposed.colors);
  const { pairs } = matchColorPair(origColors, propColors);
  const colorChanges: ColorChangeEntry[] = [];

  for (const { before, after } of pairs) {
    if (before && !after) {
      colorChanges.push({
        kind: 'REMOVED',
        before,
        details: [`Removed color "${before.name}"`],
      });
    } else if (!before && after) {
      colorChanges.push({
        kind: 'ADDED',
        after,
        details: [`Added new color "${after.name}" (${after.hex})`],
      });
    } else if (before && after) {
      const details: string[] = [];
      if (before.name !== after.name) {
        details.push(`Color renamed: "${before.name}" → "${after.name}"`);
      }
      if (before.hex.toLowerCase() !== after.hex.toLowerCase()) {
        details.push(`Swatch hex changed: ${before.hex} → ${after.hex}`);
      }
      if (cleanStr(before.imageUrl) !== cleanStr(after.imageUrl)) {
        details.push('Swatch photo updated');
      }
      const bSizes = normalizeStringList(before.sizes);
      const aSizes = normalizeStringList(after.sizes);
      if (bSizes.join(',') !== aSizes.join(',')) {
        details.push(`Sizes: [${bSizes.join(', ') || '—'}] → [${aSizes.join(', ') || '—'}]`);
      }
      if (details.length > 0) {
        colorChanges.push({
          kind: 'MODIFIED',
          before,
          after,
          details,
        });
      }
    }
  }

  if (colorChanges.length > 0) {
    changedFields.push('Colors');
  }

  // Sizes diff
  const origSizes = normalizeStringList(original.sizes);
  const propSizes = normalizeStringList(proposed.sizes);
  const addedSizes = propSizes.filter((s) => !origSizes.includes(s));
  const removedSizes = origSizes.filter((s) => !propSizes.includes(s));
  if (addedSizes.length > 0 || removedSizes.length > 0) {
    changedFields.push('Sizes');
  }

  // Images diff
  const beforePrimary = cleanStr(original.imageUrl);
  const afterPrimary = cleanStr(proposed.imageUrl);
  const primaryChanged = beforePrimary !== afterPrimary;
  const origImages = normalizeImageList(original.imageUrl, original.images);
  const propImages = normalizeImageList(proposed.imageUrl, proposed.images);
  const addedImages = propImages.filter((img) => !origImages.includes(img));
  const removedImages = origImages.filter((img) => !propImages.includes(img));
  if (primaryChanged || addedImages.length > 0 || removedImages.length > 0) {
    changedFields.push('Photos');
  }

  // Features diff
  const origFeatures = normalizeStringList(original.keyFeatures);
  const propFeatures = normalizeStringList(proposed.keyFeatures);
  const addedFeatures = propFeatures.filter((f) => !origFeatures.includes(f));
  const removedFeatures = origFeatures.filter((f) => !propFeatures.includes(f));
  if (addedFeatures.length > 0 || removedFeatures.length > 0) {
    changedFields.push('Key Features');
  }

  // Variant list fallback check if colors/sizes didn't catch a variant addition/removal
  const origVarLen = Array.isArray(original.variantsList) ? original.variantsList.length : 0;
  const propVarLen = Array.isArray(proposed.variantsList) ? proposed.variantsList.length : 0;
  if (origVarLen !== propVarLen && !changedFields.includes('Colors') && !changedFields.includes('Sizes')) {
    changedFields.push('Variants');
  }

  const dedupedFields = Array.from(new Set(changedFields));

  return {
    changedFields: dedupedFields,
    scalarChanges,
    colorChanges,
    sizeChanges: { added: addedSizes, removed: removedSizes },
    imageChanges: {
      primaryChanged,
      beforePrimary: beforePrimary || undefined,
      afterPrimary: afterPrimary || undefined,
      addedImages,
      removedImages,
    },
    featureChanges: { added: addedFeatures, removed: removedFeatures },
    hasChanges: dedupedFields.length > 0,
  };
}

function mergeApprovedVariantsPreservingStock<
  TExisting extends { id?: string; variantSku?: string; sku?: string; color?: string; size?: string; stock: number },
>(
  existingVariants: TExisting[] = [],
  proposedVariants: ProductRevisionVariant[] = [],
  proposedColors: ProductRevisionColor[] = []
): Array<{
  id: string;
  variantSku: string;
  color?: string;
  size?: string;
  imageUrl?: string;
  attributeName?: string;
  attributeValue?: string;
  stock: number;
}> {
  if (!Array.isArray(proposedVariants) || proposedVariants.length === 0) {
    return existingVariants.map((ev, idx) => ({
      id: ev.id || `var-${idx + 1}`,
      variantSku: ev.variantSku || ev.sku || `SKU-${idx + 1}`,
      color: ev.color,
      size: ev.size,
      stock: ev.stock,
    }));
  }

  const matchedExistingIds = new Set<string>();
  return proposedVariants.map((pv, idx) => {
    const pvColor = cleanStr(pv.color);
    const pvOrigColor =
      cleanStr(pv.originalColor) ||
      cleanStr(
        proposedColors.find((c) => c.name.toLowerCase() === pvColor.toLowerCase())?.originalName
      );
    const pvSize = cleanStr(pv.size || pv.attributeValue);
    const pvOrigSize = cleanStr(pv.originalSize) || pvSize;
    const pvSku = cleanStr(pv.variantSku || pv.sku).toUpperCase();

    const match = existingVariants.find((ev, eIdx) => {
      const evKey = ev.id || `ev-${eIdx}`;
      if (matchedExistingIds.has(evKey)) return false;
      if (pv.id && ev.id && pv.id === ev.id) return true;
      const evSku = cleanStr(ev.variantSku || ev.sku).toUpperCase();
      if (pvSku && evSku && pvSku === evSku) return true;
      const evColor = cleanStr(ev.color).toLowerCase();
      const evSize = cleanStr(ev.size).toLowerCase();
      if (pvOrigColor && evColor === pvOrigColor.toLowerCase() && evSize === pvOrigSize.toLowerCase()) {
        return true;
      }
      if (pvColor && evColor === pvColor.toLowerCase() && evSize === pvSize.toLowerCase()) {
        return true;
      }
      if (existingVariants.length === 1 && proposedVariants.length === 1) {
        return true;
      }
      return false;
    });

    if (match) {
      const mIdx = existingVariants.indexOf(match);
      matchedExistingIds.add(match.id || `ev-${mIdx}`);
    }

    return {
      id: match?.id || pv.id || `var-${Date.now()}-${idx}`,
      variantSku: match?.variantSku || match?.sku || pv.variantSku || pv.sku || `VAR-${idx + 1}`,
      color: pvColor || match?.color || 'Standard',
      size: pvSize || match?.size || 'Standard',
      imageUrl: pv.imageUrl,
      attributeName: pv.attributeName,
      attributeValue: pv.attributeValue,
      stock: match ? match.stock : 0,
    };
  });
}

/**
 * Applies an approved revision snapshot to an Admin WarehouseProductItem while preserving
 * live status, binCode, stock, stockAccepted, and existing variant stock.
 */
export function applyRevisionSnapshotToWarehouseProduct<T extends Record<string, any>>(
  product: T,
  snapshot: ProductRevisionSnapshot
): T {
  const cleanColors = normalizeColors(snapshot.colors).map(({ originalName: _orig, ...rest }) => rest);
  const nextVariants = mergeApprovedVariantsPreservingStock(
    product.variantsList || [],
    snapshot.variantsList || [],
    snapshot.colors || []
  );
  const firstColor = cleanColors[0]?.name || nextVariants[0]?.color || product.color;
  const firstSize =
    snapshot.sizes?.[0] || nextVariants[0]?.size || product.size;
  const nextImages = normalizeImageList(snapshot.imageUrl, snapshot.images);

  return {
    ...product,
    title: snapshot.title || product.title,
    description: snapshot.description !== undefined ? snapshot.description : product.description,
    category: snapshot.category || product.category,
    price: snapshot.price !== undefined ? Number(snapshot.price) : product.price,
    imageUrl: snapshot.imageUrl || nextImages[0] || product.imageUrl,
    images: nextImages.length > 0 ? nextImages : product.images,
    color: firstColor,
    size: firstSize,
    colors: cleanColors.length > 0 ? cleanColors : product.colors,
    sizes: snapshot.sizes && snapshot.sizes.length > 0 ? snapshot.sizes : product.sizes,
    variantsList: nextVariants.length > 0 ? nextVariants : product.variantsList,
    editState: null,
    pendingEdit: null,
    lastEditRejectionReason: undefined,
  };
}

/**
 * Applies an approved revision snapshot to a MerchantProductItem while preserving
 * live status, bin, stock, stockAccepted, stockStatus, and existing variant stock.
 */
export function applyRevisionSnapshotToMerchantProduct<T extends Record<string, any>>(
  product: T,
  snapshot: ProductRevisionSnapshot
): T {
  const cleanColors = normalizeColors(snapshot.colors).map(({ originalName: _orig, ...rest }) => rest);
  const nextVariants = mergeApprovedVariantsPreservingStock(
    product.variantsList || [],
    snapshot.variantsList || [],
    snapshot.colors || []
  );
  const nextImages = normalizeImageList(snapshot.imageUrl, snapshot.images);

  return {
    ...product,
    title: snapshot.title || product.title,
    description: snapshot.description !== undefined ? snapshot.description : product.description,
    category: snapshot.category || product.category,
    subcategory: snapshot.subcategory !== undefined ? snapshot.subcategory : product.subcategory,
    productType: snapshot.productType || product.productType,
    price: snapshot.price !== undefined ? Number(snapshot.price) : product.price,
    costPrice: snapshot.costPrice !== undefined ? Number(snapshot.costPrice) : product.costPrice,
    imageUrl: snapshot.imageUrl || nextImages[0] || product.imageUrl,
    images: nextImages.length > 0 ? nextImages : product.images,
    keyFeatures:
      snapshot.keyFeatures && snapshot.keyFeatures.length > 0
        ? snapshot.keyFeatures
        : product.keyFeatures,
    colors: cleanColors.length > 0 ? cleanColors : product.colors,
    sizes: snapshot.sizes && snapshot.sizes.length > 0 ? snapshot.sizes : product.sizes,
    variantsList: nextVariants.length > 0 ? nextVariants : product.variantsList,
    editState: null,
    pendingEdit: null,
    lastEditRejectionReason: undefined,
  };
}
