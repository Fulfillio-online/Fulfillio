'use client';

import React from 'react';
import {
  Printer,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Package,
  MapPin,
  Truck,
  User,
  FileText,
  Barcode as BarcodeIcon,
  Hash,
  Clock,
  Building2,
  Calendar,
} from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { StockMovementRecord } from '../../types';

interface StockMovementReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: StockMovementRecord | null;
}

export function StockMovementReceiptModal({
  isOpen,
  onClose,
  record,
}: StockMovementReceiptModalProps) {
  if (!record) return null;

  const isPositive = record.deltaQty > 0;
  const typeLabel =
    record.type === 'INITIAL_INTAKE'
      ? 'Initial Catalog Intake'
      : record.type === 'RESTOCK'
      ? 'Inbound Stock Restock'
      : record.type === 'WITHDRAWAL'
      ? 'Merchant Stock Withdrawal / Recall'
      : 'Warehouse Audit Adjustment';

  const typeColorClasses =
    record.type === 'INITIAL_INTAKE'
      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
      : record.type === 'RESTOCK'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      : record.type === 'WITHDRAWAL'
      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
      : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Warehouse Digital Proof Slip"
      subtitle="Cryptographically audited inventory movement & material transfer record"
      size="xl"
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-100 print:text-black">
        {/* Printable Voucher Sheet */}
        <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-navy-950/70 border border-slate-200 dark:border-white/10 space-y-6 print:border-black print:bg-white print:p-0">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10 print:border-black">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-wider uppercase text-orange-600 dark:text-orange-400">
                  FULFILLIO WMS
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  CENTRAL HUB #01
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Inward / Outward Inventory Transfer Challan
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Proof Reference ID
              </div>
              <div className="text-base sm:text-lg font-black font-mono tracking-tight text-navy-900 dark:text-white">
                {record.id}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 sm:justify-end">
                <Clock className="w-3.5 h-3.5" />
                <span>{record.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Movement Type & Status Badge Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 print:border-slate-300">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-lg border font-bold uppercase ${typeColorClasses}`}>
                {typeLabel}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Ref No: <strong className="font-mono text-navy-900 dark:text-white">{record.referenceNumber}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>DIGITALLY AUDITED &amp; VERIFIED</span>
            </div>
          </div>

          {/* Merchant & Warehouse Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-500" />
                <span>Merchant / Account Partner</span>
              </div>
              <div className="text-sm font-bold text-navy-900 dark:text-white">
                {record.merchantName}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Merchant Code: <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{record.merchantCode}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>Warehouse Bin Location</span>
              </div>
              <div className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <span>Bin {record.binCode}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  SLOTTED
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Facility: Tejgaon Central Sorting Hub (DH-01)
              </div>
            </div>
          </div>

          {/* Product & Quantity Delta Table */}
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900">
            <div className="px-4 py-3 bg-slate-100/70 dark:bg-navy-950/70 border-b border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Inventory Movement Details
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-navy-900 dark:text-white">
                    {record.productTitle}
                  </div>
                  <div className="text-xs font-mono text-orange-600 dark:text-orange-400">
                    SKU: {record.sku}
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Product ID: <span className="font-mono">{record.productId}</span>
                </div>
              </div>

              {/* Quantities Transition Row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Previous Stock
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-slate-700 dark:text-slate-200 mt-1">
                    {record.previousStock} <span className="text-xs font-normal text-slate-400">pcs</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  isPositive
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {isPositive ? 'Verified Inbound' : 'Authorized Outbound'}
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono mt-1">
                    {isPositive ? `+${record.deltaQty}` : `${record.deltaQty}`}{' '}
                    <span className="text-xs font-normal opacity-75">pcs</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    New On-Hand Stock
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-navy-900 dark:text-white mt-1">
                    {record.newStock} <span className="text-xs font-normal text-slate-400">pcs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics, Transport & Custody Details */}
          <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-500" />
              <span>Chain of Custody &amp; Transport Proof</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Carrier / Courier: </span>
                <span className="font-semibold text-navy-900 dark:text-white">
                  {record.carrierOrCourier || 'Merchant Self-Transport'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Driver / Representative: </span>
                <span className="font-semibold text-navy-900 dark:text-white">
                  {record.driverOrRepName || 'Authorized Store Representative'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Reference Document: </span>
                <span className="font-mono font-bold text-navy-900 dark:text-white">
                  {record.referenceDocType} ({record.referenceNumber})
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Auditing Operator: </span>
                <span className="font-semibold text-navy-900 dark:text-white">
                  {record.operator}
                </span>
              </div>
            </div>

            {record.notes && (
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Notes / Remarks: </span>
                <span>{record.notes}</span>
              </div>
            )}
          </div>

          {/* Digital Signature & Verification Barcode Section */}
          <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start">
                <Hash className="w-3.5 h-3.5 text-purple-500" />
                <span>Cryptographic Proof Checksum</span>
              </div>
              <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                {record.digitalProofHash}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tamper-proof ledger seal · Verified: {record.verifiedAt}
              </div>
            </div>

            {/* Visual Barcode Stamp */}
            <div className="flex flex-col items-center p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                <BarcodeIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span>{record.id}</span>
              </div>
              <div className="w-36 h-4 bg-[repeating-linear-gradient(90deg,#000_0px,#000_2px,transparent_2px,transparent_4px,#000_4px,#000_7px,transparent_7px,transparent_9px)] dark:bg-[repeating-linear-gradient(90deg,#fff_0px,#fff_2px,transparent_2px,transparent_4px,#fff_4px,#fff_7px,transparent_7px,transparent_9px)] opacity-85 mt-1" />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Slip</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-navy-800 hover:bg-slate-300 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
