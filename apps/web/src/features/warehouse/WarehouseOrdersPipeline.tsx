'use client';

// Backwards compatibility re-export
// The orders pipeline feature has been decomposed into modular components under @/features/orders
export * from '@/features/orders';
export { OrdersPipelineManager as WarehouseOrdersPipeline } from '@/features/orders';
export { default } from '@/features/orders';
