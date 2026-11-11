'use client';

import React from 'react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantProductsTab } from '@/features/merchant/portal/products';

export default function MerchantProductsPage() {
  const {
    products,
    orders,
    stockRequests,
    profile,
    deleteProduct,
    addProducts,
    updateProduct,
    toggleProductStatus,
    bulkUpdateStatus,
    bulkDeleteProducts,
    requestStockAdd,
    approveStockRequest,
    cancelStockRequest,
    showToast,
  } = useMerchant();

  return (
    <MerchantProductsTab
      products={products}
      orders={orders}
      stockRequests={stockRequests}
      merchantCode={profile.merchantCode}
      storeName={profile.storeName}
      onDeleteProduct={deleteProduct}
      onAddProducts={addProducts}
      onUpdateProduct={updateProduct}
      onToggleStatus={toggleProductStatus}
      onBulkUpdateStatus={bulkUpdateStatus}
      onBulkDelete={bulkDeleteProducts}
      onRequestStockAdd={requestStockAdd}
      onApproveStockRequest={approveStockRequest}
      onCancelStockRequest={cancelStockRequest}
      onTriggerToast={showToast}
    />
  );
}
