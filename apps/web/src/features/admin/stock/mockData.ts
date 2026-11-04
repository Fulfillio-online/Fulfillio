import { StockAuditLogItem } from './types';

export const STORAGE_KEY_STOCK_AUDIT = 'fulfillio_stock_audit_log_v1';

export const INITIAL_AUDIT_LOG: StockAuditLogItem[] = [
  {
    id: 'AUD-901',
    timestamp: 'Yesterday, 04:00 PM',
    merchantCode: 'MC-101',
    fullSku: 'MC-101-POLO-NVY-L',
    productTitle: 'Royal Pique Classic Polo Shirt',
    binCode: 'A-01-04',
    deltaQty: 2,
    previousStock: 110,
    newStock: 112,
    type: 'RTO_RESTOCK',
    reason: 'Returned parcel RTO-505 (ORD-9794) passed QC inspection & restocked to Bin A-01-04',
    referenceId: 'RTO-505',
  },
  {
    id: 'AUD-902',
    timestamp: '2 days ago',
    merchantCode: 'MC-102',
    fullSku: 'MC-102-GTEE-PRP-L',
    productTitle: 'Tokyo Drift Oversized Drop-Shoulder Tee',
    binCode: 'B-01-03',
    deltaQty: 5,
    previousStock: 140,
    newStock: 145,
    type: 'CYCLE_SURPLUS',
    reason: 'Weekly shelf cycle count surplus verified in Zone B',
    referenceId: 'CYC-204',
  },
  {
    id: 'AUD-903',
    timestamp: '3 days ago',
    merchantCode: 'MC-101',
    fullSku: 'MC-101-HOODIE-BLK-XL',
    productTitle: 'Arctic Fleece Heavyweight Hoodie',
    binCode: 'A-01-02',
    deltaQty: -1,
    previousStock: 85,
    newStock: 84,
    type: 'DAMAGE_WRITEOFF',
    reason: 'Packaging tear found during wave picking inspection',
    referenceId: 'DMG-108',
  },
];
