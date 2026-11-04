import React from 'react';
import { createPortal } from 'react-dom';
import { UnifiedThermalSticker } from '@/features/thermal-print/UnifiedThermalSticker';
import { PackingOrder } from '../types';

interface HiddenThermalPrintPortalProps {
  mounted: boolean;
  ordersToPrint: PackingOrder[];
}

export function HiddenThermalPrintPortal({
  mounted,
  ordersToPrint,
}: HiddenThermalPrintPortalProps) {
  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div id="fulfillio-print-invoice-root" className="hidden">
      {ordersToPrint.map((order) => (
        <div
          key={order.id}
          className="fulfillio-thermal-page-break"
          style={{ pageBreakAfter: 'always' }}
        >
          <UnifiedThermalSticker
            orderId={order.id}
            memoCode={order.memoCode}
            resellerName={order.resellerName}
            resellerPhone={order.resellerPhone}
            resellerAddress={order.resellerAddress}
            brandColor={order.brandColor}
            customerName={order.customerName}
            customerPhone={order.customerPhone}
            customerAddress={order.customerAddress}
            city={order.city}
            codAmount={order.codAmount}
            courierProvider={order.courier.toUpperCase()}
            consignmentId={order.consignmentId}
            trackingCode={order.trackingCode}
            packagingType={order.packagingType}
            items={order.items}
          />
        </div>
      ))}
    </div>,
    document.body,
  );
}
