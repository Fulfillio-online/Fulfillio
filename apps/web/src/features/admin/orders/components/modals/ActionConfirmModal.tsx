'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { CourierPartner, PendingConfirmationAction, WarehousePipelineOrder } from '../../types';
import { HOLD_REASON_PRESETS } from '../../mockData';

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingAction: PendingConfirmationAction | null;
  onConfirm: (
    action: PendingConfirmationAction,
    holdReason?: string,
    courierOverride?: 'KEEP_ORDER_COURIER' | CourierPartner
  ) => void;
}

export function ActionConfirmModal({
  isOpen,
  onClose,
  pendingAction,
  onConfirm,
}: ActionConfirmModalProps) {
  const [holdReasonInput, setHoldReasonInput] = useState<string>(HOLD_REASON_PRESETS[0]);
  const [courierOverride, setCourierOverride] = useState<'KEEP_ORDER_COURIER' | CourierPartner>(
    'KEEP_ORDER_COURIER'
  );

  useEffect(() => {
    if (pendingAction?.type === 'MARK_WAITING') {
      setHoldReasonInput(HOLD_REASON_PRESETS[0]);
    }
    if (pendingAction?.type === 'BOOK_COURIER') {
      setCourierOverride(
        pendingAction.orders.length === 1 ? pendingAction.orders[0].courier : 'KEEP_ORDER_COURIER'
      );
    }
  }, [pendingAction]);

  if (!pendingAction) return null;

  const getTitle = () => {
    switch (pendingAction.type) {
      case 'MARK_PICKED':
        return 'Confirm Bin Pick Verification';
      case 'MARK_WAITING':
        return 'Confirm Waiting / Hold (Item Not Found in Bin)';
      case 'RESUME_PICK':
        return 'Confirm Item Found — Resume Pick List';
      case 'PRINT_AND_PACK':
        return 'Confirm 4x6" Thermal Print & Pack Completion';
      case 'BOOK_COURIER':
        return 'Confirm Courier API Booking & Courier Selection';
      case 'CONFIRM_HANDOVER':
        return 'Confirm Physical Courier Handover & Dispatch';
      case 'CANCEL_ORDER':
        return 'Confirm Order Cancellation & Stock Return';
    }
  };

  const handleProceed = () => {
    onConfirm(pendingAction, holdReasonInput, courierOverride);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle={`Please verify the ${pendingAction.orders.length} selected order(s) before proceeding.`}
      size="md"
    >
      <div className="space-y-4 text-xs">
        {/* Action Summary Banner */}
        <div
          className={`rounded-xl border p-3.5 flex items-start gap-3 ${
            pendingAction.type === 'CANCEL_ORDER'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/40 text-rose-800 dark:text-rose-200'
              : pendingAction.type === 'MARK_WAITING'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500/40 text-amber-800 dark:text-amber-200'
              : 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-500/35 text-navy-800 dark:text-slate-100'
          }`}
        >
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-orange-600 dark:text-orange-400" />
          <div className="space-y-1">
            <div className="font-bold text-navy-800 dark:text-white">
              {pendingAction.type === 'MARK_PICKED' &&
                `Move ${pendingAction.orders.length} order(s) from 1. Pick List to 2. Pack & 4x6" Print.`}
              {pendingAction.type === 'MARK_WAITING' &&
                `Place ${pendingAction.orders.length} order(s) into Waiting / Not Found in Bin status.`}
              {pendingAction.type === 'RESUME_PICK' &&
                `Return ${pendingAction.orders.length} waiting order(s) back to Ready to Pick.`}
              {pendingAction.type === 'PRINT_AND_PACK' &&
                `Print ${pendingAction.orders.length} 4x6" Thermal Sticker(s) and move to 3. Courier Dispatch.`}
              {pendingAction.type === 'BOOK_COURIER' &&
                `Transmit ${pendingAction.orders.length} order(s) to Courier API and generate Tracking IDs.`}
              {pendingAction.type === 'CONFIRM_HANDOVER' &&
                `Confirm courier pickup rider handover for ${pendingAction.orders.length} parcel(s). They will leave the active warehouse pipeline and move to Dispatched & Delivery Tracker.`}
              {pendingAction.type === 'CANCEL_ORDER' &&
                `Cancel order and immediately restore reserved inventory units back to the assigned warehouse bin.`}
            </div>
          </div>
        </div>

        {/* Affected Orders List */}
        <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
          {pendingAction.orders.map((ord) => (
            <div
              key={ord.id}
              className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-2.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={ord.productImage}
                  alt={ord.productTitle}
                  className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums font-extrabold text-navy-800 dark:text-white">{ord.id}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 tabular-nums text-[11px] font-bold">
                      Bin: {ord.bin}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-200 truncate">{ord.productTitle}</div>
                  <div className="text-[11px] tabular-nums text-slate-600 dark:text-slate-300">
                    {ord.sku} · Qty: {ord.qty} · Customer: {ord.customerName}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="tabular-nums font-bold text-orange-600 dark:text-orange-400 block">
                  ৳ {ord.codAmount.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">{ord.courier}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Extra Input: Hold Reason */}
        {pendingAction.type === 'MARK_WAITING' && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <label className="block font-bold text-amber-700 dark:text-amber-300">
              Select or Enter Reason Item Could Not Be Picked from Bin:
            </label>
            <select
              value={
                HOLD_REASON_PRESETS.includes(holdReasonInput) ? holdReasonInput : '__CUSTOM__'
              }
              onChange={(e) => {
                if (e.target.value !== '__CUSTOM__') {
                  setHoldReasonInput(e.target.value);
                }
              }}
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-amber-500"
            >
              {HOLD_REASON_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
              <option value="__CUSTOM__">Custom reason...</option>
            </select>
            <input
              type="text"
              value={holdReasonInput}
              onChange={(e) => setHoldReasonInput(e.target.value)}
              placeholder="Describe why the item was not found in the bin..."
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        {/* Extra Input: Courier Override */}
        {pendingAction.type === 'BOOK_COURIER' && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <label className="block font-bold text-sky-700 dark:text-sky-300">
              Courier Partner (Change here if merchant&apos;s default courier has an issue):
            </label>
            <select
              value={courierOverride}
              onChange={(e) =>
                setCourierOverride(e.target.value as 'KEEP_ORDER_COURIER' | CourierPartner)
              }
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2.5 text-navy-800 dark:text-white font-bold focus:outline-none focus:border-orange-500"
            >
              {pendingAction.orders.length > 1 && (
                <option value="KEEP_ORDER_COURIER">
                  Keep Each Order&apos;s Assigned Courier
                </option>
              )}
              <option value="Steadfast">Steadfast Courier</option>
              <option value="Pathao">Pathao Courier</option>
              <option value="RedX">RedX Logistics</option>
            </select>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className={`px-4 py-2 rounded-xl font-bold text-white flex items-center gap-1.5 shadow-lg cursor-pointer ${
              pendingAction.type === 'CANCEL_ORDER'
                ? 'bg-rose-600 hover:bg-rose-500'
                : pendingAction.type === 'MARK_WAITING'
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm &amp; Proceed</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
