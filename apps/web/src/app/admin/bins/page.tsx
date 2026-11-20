'use client';

import React from 'react';
import { WarehouseBinsManager } from '@/features/admin/bins';

export default function AdminBinsPage() {
  return (
    <div className="space-y-6">
      <WarehouseBinsManager />
    </div>
  );
}
