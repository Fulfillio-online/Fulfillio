'use client';

// Backwards compatibility re-export
// The products feature has been decomposed into modular components under @/features/products
export * from '@/features/products';
export { ProductsManager as WarehouseProductsManager } from '@/features/products';
export { default } from '@/features/products';
