'use client';

import React from 'react';
import { CourierIntegrationManager } from '@/features/couriers';

export default function AdminCouriersPage() {
  return (
    <div className="space-y-6">
      <CourierIntegrationManager />
    </div>
  );
}
