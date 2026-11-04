import React from 'react';
import { Tag, Truck, CheckCircle2, Eye } from 'lucide-react';
import { PackingOrder } from '../types';

interface PackingOrdersTableProps {
  orders: PackingOrder[];
  selectedIds: string[];
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: () => void;
  onToggleSelectOne: (id: string) => void;
  onPreviewOrder: (order: PackingOrder) => void;
}

export function PackingOrdersTable({
  orders,
  selectedIds,
  allVisibleSelected,
  onToggleSelectAllVisible,
  onToggleSelectOne,
  onPreviewOrder,
}: PackingOrdersTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-4 w-12">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={onToggleSelectAllVisible}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    aria-label="Select All Orders"
                  />
                </label>
              </th>
              <th className="py-3.5 px-3">Order ID</th>
              <th className="py-3.5 px-3">Merchant</th>
              <th className="py-3.5 px-3">Reseller Branded Memo Code</th>
              <th className="py-3.5 px-3">Customer &amp; City</th>
              <th className="py-3.5 px-3">Product, Color/Size, 2-Part SKU &amp; Qty</th>
              <th className="py-3.5 px-3">Courier</th>
              <th className="py-3.5 px-3 text-right">COD Amount</th>
              <th className="py-3.5 px-3 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">4x6&quot; Thermal Slip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-sm">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  No orders found matching the selected tab or filter criteria.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                return (
                  <tr
                    key={order.id}
                    onClick={() => onToggleSelectOne(order.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/25 hover:bg-emerald-950/35'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td
                      className="py-4 px-4 align-top"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectOne(order.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 mt-1"
                        aria-label={`Select ${order.id}`}
                      />
                    </td>

                    {/* Order ID */}
                    <td className="py-4 px-3 align-top">
                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        {order.id}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Rack: {order.pickedRack}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        PKG: {order.packagingType}
                      </div>
                    </td>

                    {/* Merchant */}
                    <td className="py-4 px-3 align-top">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                        {order.merchantCode} · {order.merchantName}
                      </span>
                    </td>

                    {/* Reseller Branded Memo Code */}
                    <td className="py-4 px-3 align-top">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <Tag className="w-3 h-3 text-emerald-400" />
                        {order.memoCode}
                      </span>
                      <div className="text-xs font-semibold text-slate-200 mt-1">
                        {order.resellerName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Hotline: {order.resellerPhone}
                      </div>
                    </td>

                    {/* Customer Name, Phone, City */}
                    <td className="py-4 px-3 align-top">
                      <div className="font-semibold text-slate-100">{order.customerName}</div>
                      <div className="text-xs font-mono text-slate-300 mt-0.5">
                        {order.customerPhone}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {order.city}
                      </span>
                    </td>

                    {/* Product Title + Color + Size + 2-Part SKU + Qty */}
                    <td className="py-4 px-3 align-top">
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/70 border border-slate-800 rounded-lg p-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-xs text-slate-100">
                                {item.title}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xs shrink-0">
                                Qty: {item.qty}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                              <span className="font-mono text-emerald-400 font-semibold">
                                SKU: {item.sku}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-300">
                                Color: <strong>{item.color}</strong>
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-300">
                                Size: <strong>{item.size}</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Courier */}
                    <td className="py-4 px-3 align-top">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        {order.courier}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        {order.consignmentId}
                      </div>
                    </td>

                    {/* COD Amount */}
                    <td className="py-4 px-3 align-top text-right">
                      <span className="font-mono font-black text-base text-white">
                        ৳{order.codAmount.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-3 align-top text-center">
                      {order.status === 'READY_TO_PACK' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          READY_TO_PACK
                        </span>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            PACKED
                          </span>
                          {order.packedAt && (
                            <span className="text-[10px] font-mono text-slate-400 mt-1">
                              at {order.packedAt}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Preview 4x6 Slip Button */}
                    <td
                      className="py-4 px-4 align-top text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onPreviewOrder(order)}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview 4x6 Slip
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
