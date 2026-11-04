'use client';

import React, { useState } from 'react';
import {
  Truck,
  PackagePlus,
  CheckCircle2,
  AlertOctagon,
  Boxes,
  ArrowDownToLine,
  ShieldCheck,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, CardContent, Modal } from '@/components/ui';

export interface AsnShipmentItem {
  variantId: string;
  sku: string;
  title: string;
  expectedQty: number;
  receivedGoodQty: number;
  receivedDamagedQty: number;
  binCode: string;
}

export interface AsnShipmentRecord {
  id: string;
  asnCode: string;
  merchantCode: string;
  merchantName: string;
  carrierName: string;
  trackingRef: string;
  expectedDate: string;
  status: 'IN_TRANSIT' | 'ARRIVED_AT_DOCK' | 'COMPLETED';
  items: AsnShipmentItem[];
}

const INITIAL_ASN_LIST: AsnShipmentRecord[] = [
  {
    id: 'asn-101',
    asnCode: 'ASN-2026-8410',
    merchantCode: 'MC-101',
    merchantName: 'Dhaka Threads & Apparel',
    carrierName: 'SA Paribahan Parcel',
    trackingRef: 'SAP-992014',
    expectedDate: '2026-10-24',
    status: 'ARRIVED_AT_DOCK',
    items: [
      {
        variantId: 'v-1',
        sku: 'MC-101-HOODIE-BLK-XL',
        title: 'Heavyweight Fleece Hoodie (Black / XL)',
        expectedQty: 150,
        receivedGoodQty: 148,
        receivedDamagedQty: 2,
        binCode: 'A-01-02',
      },
      {
        variantId: 'v-2',
        sku: 'MC-101-POLO-NVY-L',
        title: 'Classic Pique Polo Shirt (Navy / L)',
        expectedQty: 100,
        receivedGoodQty: 100,
        receivedDamagedQty: 0,
        binCode: 'A-01-04',
      },
    ],
  },
  {
    id: 'asn-102',
    asnCode: 'ASN-2026-8419',
    merchantCode: 'MC-101',
    merchantName: 'Dhaka Threads & Apparel',
    carrierName: 'Sundarban Courier Logistics',
    trackingRef: 'SCS-441820',
    expectedDate: '2026-10-25',
    status: 'IN_TRANSIT',
    items: [
      {
        variantId: 'v-3',
        sku: 'MC-101-DENIM-BLU-32',
        title: 'Slim Stretch Denim Jeans (Blue / 32)',
        expectedQty: 80,
        receivedGoodQty: 80,
        receivedDamagedQty: 0,
        binCode: 'B-02-01',
      },
    ],
  },
];

export interface InboundAsnManagerProps {
  mode: 'MERCHANT' | 'WAREHOUSE';
  merchantCode?: string;
  onStockReceived?: (sku: string, goodQty: number, damagedQty: number) => void;
}

export function InboundAsnManager({
  mode,
  merchantCode = 'MC-101',
  onStockReceived,
}: InboundAsnManagerProps) {
  const [shipments, setShipments] = useState<AsnShipmentRecord[]>(INITIAL_ASN_LIST);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inspectShipment, setInspectShipment] = useState<AsnShipmentRecord | null>(null);

  // Create ASN Form State
  const [carrierName, setCarrierName] = useState('SA Paribahan');
  const [trackingRef, setTrackingRef] = useState('');
  const [selectedSku, setSelectedSku] = useState(`${merchantCode}-HOODIE-BLK-XL`);
  const [productTitle, setProductTitle] = useState('Heavyweight Fleece Hoodie (Black / XL)');
  const [expectedQty, setExpectedQty] = useState(100);
  const [preferredBin, setPreferredBin] = useState('A-01-02');

  const handleCreateAsn = (e: React.FormEvent) => {
    e.preventDefault();
    const newAsn: AsnShipmentRecord = {
      id: `asn-${Date.now()}`,
      asnCode: `ASN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      merchantCode,
      merchantName: 'Dhaka Threads & Apparel',
      carrierName,
      trackingRef: trackingRef || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      expectedDate: new Date().toISOString().slice(0, 10),
      status: 'ARRIVED_AT_DOCK',
      items: [
        {
          variantId: `v-${Date.now()}`,
          sku: selectedSku.toUpperCase(),
          title: productTitle,
          expectedQty: Number(expectedQty),
          receivedGoodQty: Number(expectedQty),
          receivedDamagedQty: 0,
          binCode: preferredBin.toUpperCase(),
        },
      ],
    };
    setShipments((prev) => [newAsn, ...prev]);
    setIsCreateOpen(false);
    setTrackingRef('');
  };

  const handleConfirmPutaway = () => {
    if (!inspectShipment) return;
    setShipments((prev) =>
      prev.map((s) => (s.id === inspectShipment.id ? { ...inspectShipment, status: 'COMPLETED' } : s)),
    );
    inspectShipment.items.forEach((item) => {
      onStockReceived?.(item.sku, item.receivedGoodQty, item.receivedDamagedQty);
    });
    setInspectShipment(null);
  };

  return (
    <Card className="border-slate-800 bg-slate-900/70">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-400" />
            <CardTitle className="text-white text-lg">
              Inbound Stock Receiving (ASN / WRO)
            </CardTitle>
            <Badge variant="info">Module 14 · Audit Verified</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'MERCHANT'
              ? 'Send bulk inventory to Fulfillio 3PL Warehouse. Stock updates automatically once verified at Receiving Dock.'
              : 'Inspect physical merchant shipments at dock, separate damaged quarantine units, and put away into shelf bins.'}
          </p>
        </div>

        {mode === 'MERCHANT' ? (
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            <PackagePlus className="w-4 h-4 mr-1.5" /> + Send Inventory to Warehouse (ASN)
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="pt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                <th className="py-3 px-3">ASN Code</th>
                <th className="py-3 px-3">Carrier & Ref</th>
                <th className="py-3 px-3">2-Part SKU & Items</th>
                <th className="py-3 px-3 text-center">Expected</th>
                <th className="py-3 px-3 text-center">Good / Damaged</th>
                <th className="py-3 px-3 text-center">Target Bin</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {shipments.map((asn) => {
                const totalExpected = asn.items.reduce((sum, i) => sum + i.expectedQty, 0);
                const totalGood = asn.items.reduce((sum, i) => sum + i.receivedGoodQty, 0);
                const totalDamaged = asn.items.reduce((sum, i) => sum + i.receivedDamagedQty, 0);

                return (
                  <tr key={asn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">
                      {asn.asnCode}
                      <div className="text-[11px] font-normal text-slate-500">{asn.expectedDate}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" /> {asn.carrierName}
                      </div>
                      <div className="text-xs font-mono text-slate-400">Ref: {asn.trackingRef}</div>
                    </td>
                    <td className="py-3 px-3">
                      {asn.items.map((it, idx) => (
                        <div key={idx} className="mb-1 last:mb-0">
                          <span className="font-mono text-xs font-semibold text-emerald-400">
                            {it.sku}
                          </span>
                          <span className="text-xs text-slate-300 block">{it.title}</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-white">
                      {totalExpected} pcs
                    </td>
                    <td className="py-3 px-3 text-center">
                      {asn.status === 'COMPLETED' ? (
                        <div className="inline-flex items-center gap-2 font-mono text-xs">
                          <span className="text-emerald-400 font-bold">+{totalGood} Good</span>
                          {totalDamaged > 0 ? (
                            <span className="text-rose-400 font-bold">· {totalDamaged} Dmg</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Pending Count</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs text-amber-300">
                      {asn.items[0]?.binCode || 'A-01-01'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {asn.status === 'COMPLETED' ? (
                        <Badge variant="success">PUTAWAY COMPLETED</Badge>
                      ) : asn.status === 'ARRIVED_AT_DOCK' ? (
                        <Badge variant="warning">AT RECEIVING DOCK</Badge>
                      ) : (
                        <Badge variant="info">IN TRANSIT</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {asn.status !== 'COMPLETED' ? (
                        <Button
                          variant={mode === 'WAREHOUSE' ? 'success' : 'secondary'}
                          size="sm"
                          onClick={() => setInspectShipment(asn)}
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
                          {mode === 'WAREHOUSE' ? 'Inspect & Putaway' : 'Simulate Dock Receive'}
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <ShieldCheck className="w-4 h-4" /> Stock Credited
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* CREATE INBOUND ASN MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Send Inventory to 3PL Warehouse (Create ASN)"
        subtitle="Notify warehouse operators before dispatching cartons so Receiving Dock can verify and shelf your stock."
        size="md"
      >
        <form onSubmit={handleCreateAsn} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transport / Courier Name
              </label>
              <input
                type="text"
                required
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                placeholder="e.g. SA Paribahan / Own Van"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Challan / Receipt Number
              </label>
              <input
                type="text"
                value={trackingRef}
                onChange={(e) => setTrackingRef(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                placeholder="e.g. SAP-882190"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                2-Part SKU Code
              </label>
              <input
                type="text"
                required
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Name & Variant
              </label>
              <input
                type="text"
                required
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sending Quantity (Units)
              </label>
              <input
                type="number"
                min={1}
                required
                value={expectedQty}
                onChange={(e) => setExpectedQty(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assigned Shelf Bin
              </label>
              <input
                type="text"
                required
                value={preferredBin}
                onChange={(e) => setPreferredBin(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-amber-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create ASN & Notify Warehouse
            </Button>
          </div>
        </form>
      </Modal>

      {/* WAREHOUSE RECEIVING & DAMAGED QUARANTINE INSPECTION MODAL */}
      <Modal
        isOpen={Boolean(inspectShipment)}
        onClose={() => setInspectShipment(null)}
        title={`Dock Receiving Inspection · ${inspectShipment?.asnCode || ''}`}
        subtitle="Count physical units arriving at warehouse dock. Damaged units are automatically routed to Quarantine Shelf."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInspectShipment(null)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleConfirmPutaway}>
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirm Count & Putaway to Shelf
            </Button>
          </>
        }
      >
        {inspectShipment ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Merchant:</span>{' '}
                <strong className="text-white">
                  {inspectShipment.merchantName} ({inspectShipment.merchantCode})
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Carrier:</span>{' '}
                <strong className="text-indigo-400">
                  {inspectShipment.carrierName} ({inspectShipment.trackingRef})
                </strong>
              </div>
            </div>

            {inspectShipment.items.map((item, idx) => (
              <div
                key={item.variantId}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400">{item.sku}</span>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  </div>
                  <Badge variant="neutral">Expected: {item.expectedQty} pcs</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                      Good Sellable Units
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.receivedGoodQty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const nextItems = [...inspectShipment.items];
                        nextItems[idx] = { ...item, receivedGoodQty: val };
                        setInspectShipment({ ...inspectShipment, items: nextItems });
                      }}
                      className="w-full rounded-lg border border-emerald-500/40 bg-slate-900 px-3 py-1.5 text-sm font-mono font-bold text-emerald-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-rose-400 mb-1 flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" /> Damaged (Quarantine)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.receivedDamagedQty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const nextItems = [...inspectShipment.items];
                        nextItems[idx] = { ...item, receivedDamagedQty: val };
                        setInspectShipment({ ...inspectShipment, items: nextItems });
                      }}
                      className="w-full rounded-lg border border-rose-500/40 bg-slate-900 px-3 py-1.5 text-sm font-mono font-bold text-rose-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                      Putaway Shelf Bin
                    </label>
                    <input
                      type="text"
                      value={item.binCode}
                      onChange={(e) => {
                        const nextItems = [...inspectShipment.items];
                        nextItems[idx] = { ...item, binCode: e.target.value.toUpperCase() };
                        setInspectShipment({ ...inspectShipment, items: nextItems });
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-mono text-amber-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </Card>
  );
}
