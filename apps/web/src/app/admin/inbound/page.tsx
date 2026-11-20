'use client';

import React from 'react';
import { WarehouseInboundManager } from '@/features/admin/inbound';

export default function AdminInboundPage() {
  return (
    <div className="space-y-6">
      <WarehouseInboundManager />
    </div>
  );
}
