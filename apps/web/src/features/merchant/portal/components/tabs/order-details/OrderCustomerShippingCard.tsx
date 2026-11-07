'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Phone,
  MapPin,
  Truck,
  ExternalLink,
  Copy,
  CheckCircle2,
  PhoneCall,
  Check,
} from 'lucide-react';
import { MerchantOrderItem } from '../../../types';
import { FraudRatioBadge } from '@/components/ui/FraudRatioBadge';

interface OrderCustomerShippingCardProps {
  order: MerchantOrderItem;
  deliveryFee: number;
  onTriggerToast: (msg: string) => void;
}

export function OrderCustomerShippingCard({
  order,
  deliveryFee,
  onTriggerToast,
}: OrderCustomerShippingCardProps) {
  const [copiedTracking, setCopiedTracking] = useState(false);

  const trackingCode = order.trackingId || `del-${order.id.slice(-4)}`;

  const handleCopyTracking = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(trackingCode);
      setCopiedTracking(true);
      onTriggerToast(`Tracking Code ${trackingCode} copied!`);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const customerInitials =
    order.customerInitials ||
    (order.customer ? order.customer.substring(0, 2).toUpperCase() : 'CU');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-md space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Customer &amp; Shipping</h3>
            <p className="text-xs text-slate-400">Recipient details and assigned delivery courier</p>
          </div>
        </div>

        <a
          href={`tel:${order.phone}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Call Customer</span>
        </a>
      </div>

      {/* Recipient Profile Row */}
      <div className="flex items-start gap-3.5">
        <div className="h-11 w-11 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
          {customerInitials}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="text-sm font-bold text-slate-100 truncate">{order.customer}</h4>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <a
              href={`tel:${order.phone}`}
              className="font-mono text-slate-300 hover:text-emerald-400 transition-colors"
            >
              {order.phone}
            </a>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-300 pt-1">
            <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed text-slate-300">{order.address}</span>
          </div>
        </div>
      </div>

      {/* Fraud Ratio / Customer Risk Assessment */}
      <div className="pt-1">
        <FraudRatioBadge
          successRatio={order.phone.endsWith('000') ? 35 : 94}
          compact={false}
        />
      </div>

      {/* Courier Logistics Box */}
      <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">
              {order.courier || 'Steadfast Courier'}
            </span>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {order.courierStatus || 'Assigned'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Tracking ID
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-slate-200 font-bold text-xs truncate">
                {trackingCode}
              </span>
              <button
                type="button"
                onClick={handleCopyTracking}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy Tracking ID"
              >
                {copiedTracking ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Delivery Fee
            </span>
            <span className="font-bold text-slate-200 text-xs mt-0.5 block">
              ৳{Number(deliveryFee).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80">
          <Link
            href={`/tracking?trackingCode=${encodeURIComponent(trackingCode)}`}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <span>Track Live Shipment</span>
            <ExternalLink className="h-3 w-3 text-emerald-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
