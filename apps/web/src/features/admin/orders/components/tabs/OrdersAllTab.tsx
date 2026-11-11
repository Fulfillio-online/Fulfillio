'use client';

import React from 'react';
import { CourierPartner, OrderStage, WarehousePipelineOrder } from '../../types';
import { OrdersTableCard } from './OrdersTableCard';

export interface OrdersAllTabProps {
  orders: WarehousePipelineOrder[];
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  onClearSelection?: () => void;
  // Pagination & rows limit
  totalItems: number;
  startIndex: number;
  pageSize: number;
  safePage: number;
  totalPages: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  // Action callbacks
  onPreviewMemo: (order: WarehousePipelineOrder) => void;
  onInlineCourierChange: (orderId: string, newCourier: CourierPartner) => void;
  onInlineStageChange?: (
    orderId: string,
    newStage: OrderStage | 'COURIER_BOOKED',
    customHoldReason?: string
  ) => void;
  onMarkWaiting: (order: WarehousePipelineOrder) => void;
  onMarkPicked: (order: WarehousePipelineOrder) => void;
  onResumePick: (order: WarehousePipelineOrder) => void;
  onPrintAndPack: (order: WarehousePipelineOrder) => void;
  onBookCourier: (order: WarehousePipelineOrder) => void;
  onConfirmHandover: (order: WarehousePipelineOrder) => void;
  onCancelOrder: (order: WarehousePipelineOrder) => void;
  onViewOrder?: (order: WarehousePipelineOrder) => void;
}

export function OrdersAllTab(props: OrdersAllTabProps) {
  return (
    <OrdersTableCard
      {...props}
      emptyMessage="No active warehouse orders found in this stage matching your filter."
    />
  );
}
