import {
  CourierName,
  CourierDeliveryStatus,
  ConsignmentRequest,
  ConsignmentRecord,
  TrackingCheckpoint,
  CourierWebhookSimulationPayload,
} from './types';

const STORAGE_KEY = 'fulfillio_courier_simulator_v1';

// Base pricing by provider and location
export function calculateDeliveryFee(courier: CourierName, city: string): number {
  const isDhaka = city.trim().toLowerCase().includes('dhaka');
  switch (courier) {
    case 'Steadfast':
      return isDhaka ? 60 : 120;
    case 'Pathao':
      return isDhaka ? 60 : 130;
    case 'RedX':
      return isDhaka ? 70 : 130;
    case 'Paperfly':
      return isDhaka ? 65 : 125;
    default:
      return isDhaka ? 60 : 120;
  }
}

export function calculateCodFee(codAmount: number): number {
  return Math.round(codAmount * 0.01); // 1% COD fee standard
}

const DEFAULT_CONSIGNMENTS: ConsignmentRecord[] = [
  {
    consignmentId: 'CN-849201',
    trackingCode: 'TRK-STE-99201',
    orderId: 'ORD-99201',
    merchantCode: 'MC-101',
    courier: 'Steadfast',
    customerName: 'Tanvir Hossain',
    customerPhone: '01712-984512',
    customerAddress: 'Flat 4B, House 22, Block C, Banani, Dhaka',
    city: 'Dhaka',
    codAmount: 1450,
    deliveryCharge: 60,
    codFee: 15,
    netPayout: 1375,
    status: 'IN_TRANSIT',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    checkpoints: [
      {
        timestamp: '10:00 AM',
        status: 'PICKUP_REQUESTED',
        statusLabel: 'Consignment Created',
        location: 'Fulfillio Central Warehouse Hub (Tejgaon)',
        notes: 'Parcel booked via automated warehouse packing API',
      },
      {
        timestamp: '11:15 AM',
        status: 'PICKED_UP',
        statusLabel: 'Picked Up by Rider',
        location: 'Fulfillio Tejgaon Dispatch Bay #4',
        notes: 'Handover complete with manifest verification',
        operator: 'Steadfast Rider Tariq (ID: SF-902)',
      },
      {
        timestamp: '01:30 PM',
        status: 'IN_TRANSIT',
        statusLabel: 'Sorting Hub Inward',
        location: 'Steadfast Central Sorting Hub, Banani',
        notes: 'Bagged for Banani / Gulshan delivery cluster',
      },
    ],
  },
  {
    consignmentId: 'CN-849202',
    trackingCode: 'TRK-PTH-99202',
    orderId: 'ORD-99202',
    merchantCode: 'MC-101',
    courier: 'Pathao',
    customerName: 'Nusrat Jahan',
    customerPhone: '01833-412098',
    customerAddress: 'Road 3, O.R. Nizam Road, GEC Circle, Chattogram',
    city: 'Chattogram',
    codAmount: 980,
    deliveryCharge: 130,
    codFee: 10,
    netPayout: 840,
    status: 'IN_TRANSIT',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    checkpoints: [
      {
        timestamp: '09:30 AM',
        status: 'PICKUP_REQUESTED',
        statusLabel: 'Consignment Created',
        location: 'Fulfillio Central Warehouse Hub (Tejgaon)',
        notes: 'Order packaged in Poly Medium pouch with thermal memo',
      },
      {
        timestamp: '10:45 AM',
        status: 'PICKED_UP',
        statusLabel: 'Picked Up by Pathao Express Rider',
        location: 'Tejgaon Dispatch Bay',
        notes: 'Dispatched to Dhaka Airport / Inter-district terminal',
      },
      {
        timestamp: '02:00 PM',
        status: 'IN_TRANSIT',
        statusLabel: 'Inter-district Transit',
        location: 'Chittagong GEC Delivery Hub',
        notes: 'Arrived at regional hub, scheduled for morning delivery run',
      },
    ],
  },
  {
    consignmentId: 'CN-849203',
    trackingCode: 'TRK-STE-99203',
    orderId: 'ORD-99203',
    merchantCode: 'MC-102',
    courier: 'Steadfast',
    customerName: 'Mahmudul Hasan',
    customerPhone: '01677-309182',
    customerAddress: 'Zindabazar Main Road, Sylhet Sadar',
    city: 'Sylhet',
    codAmount: 2250,
    deliveryCharge: 120,
    codFee: 23,
    netPayout: 2107,
    status: 'DELIVERED',
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    checkpoints: [
      {
        timestamp: 'Yesterday 04:00 PM',
        status: 'PICKED_UP',
        statusLabel: 'Picked Up from Warehouse',
        location: 'Fulfillio Tejgaon Dispatch Bay',
        notes: 'Dispatched via Sylhet Highway Express',
      },
      {
        timestamp: 'Today 09:30 AM',
        status: 'OUT_FOR_DELIVERY',
        statusLabel: 'Out for Delivery',
        location: 'Sylhet Sadar Hub',
        notes: 'Rider Jashim on route to Zindabazar',
      },
      {
        timestamp: 'Today 11:45 AM',
        status: 'DELIVERED',
        statusLabel: 'Delivered & COD Collected',
        location: 'Zindabazar, Sylhet',
        notes: 'Full COD ৳2,250 received via Cash on Delivery',
        operator: 'Customer OTP Verified',
      },
    ],
  },
];

class CourierSimulatorService {
  private consignments: ConsignmentRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.consignments = JSON.parse(stored);
          return;
        }
      } catch (e) {
        console.warn('Failed to load courier simulator storage:', e);
      }
    }
    this.consignments = [...DEFAULT_CONSIGNMENTS];
    this.persist();
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.consignments));
      } catch (e) {
        console.warn('Failed to persist courier simulator storage:', e);
      }
    }
  }

  public getAll(): ConsignmentRecord[] {
    return [...this.consignments];
  }

  public getByConsignmentId(id: string): ConsignmentRecord | undefined {
    return this.consignments.find((c) => c.consignmentId === id);
  }

  public getByTrackingCode(trackingCode: string): ConsignmentRecord | undefined {
    return this.consignments.find((c) => c.trackingCode === trackingCode);
  }

  public getByOrderId(orderId: string): ConsignmentRecord | undefined {
    return this.consignments.find((c) => c.orderId === orderId);
  }

  public createConsignment(req: ConsignmentRequest): ConsignmentRecord {
    const existing = this.getByOrderId(req.orderId);
    if (existing) {
      return existing;
    }

    const providerPrefix =
      req.courier === 'Steadfast' ? 'STE' : req.courier === 'Pathao' ? 'PTH' : 'RDX';

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const consignmentId = `CN-${randomSuffix}`;
    const trackingCode = `TRK-${providerPrefix}-${req.orderId.replace(/[^0-9]/g, '') || randomSuffix}`;

    const deliveryCharge = calculateDeliveryFee(req.courier, req.city);
    const codFee = calculateCodFee(req.codAmount);
    const netPayout = Math.max(0, req.codAmount - (deliveryCharge + codFee));

    const initialCheckpoint: TrackingCheckpoint = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PICKUP_REQUESTED',
      statusLabel: 'Consignment Created',
      location: 'Fulfillio Central Warehouse Hub (Tejgaon)',
      notes: `Booked with ${req.courier}. Awaiting dispatch rider pickup.`,
    };

    const newRecord: ConsignmentRecord = {
      consignmentId,
      trackingCode,
      orderId: req.orderId,
      merchantCode: req.merchantCode,
      courier: req.courier,
      customerName: req.customerName,
      customerPhone: req.customerPhone,
      customerAddress: req.customerAddress,
      city: req.city,
      codAmount: req.codAmount,
      deliveryCharge,
      codFee,
      netPayout,
      status: 'PICKUP_REQUESTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkpoints: [initialCheckpoint],
    };

    this.consignments = [newRecord, ...this.consignments];
    this.persist();
    return newRecord;
  }

  public advanceStatus(
    consignmentId: string,
    nextStatus: CourierDeliveryStatus,
    location?: string,
    note?: string,
  ): ConsignmentRecord | null {
    const target = this.consignments.find((c) => c.consignmentId === consignmentId);
    if (!target) return null;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let label = 'Status Updated';
    let defaultLocation = location || 'Hub Central Tejgaon';
    let defaultNote = note || `Status transitioned to ${nextStatus}`;

    switch (nextStatus) {
      case 'PICKED_UP':
        label = 'Handed Over to Courier Rider';
        defaultLocation = location || 'Fulfillio Tejgaon Dispatch Bay';
        defaultNote = note || `Rider scanned manifest and accepted parcel`;
        break;
      case 'IN_TRANSIT':
        label = 'In Transit';
        defaultLocation = location || `${target.courier} Central Sorting Facility`;
        defaultNote = note || `Processing for destination city hub`;
        break;
      case 'OUT_FOR_DELIVERY':
        label = 'Out for Delivery';
        defaultLocation = location || `${target.city} Local Destination Hub`;
        defaultNote = note || `Assigned to delivery agent for final handover`;
        break;
      case 'DELIVERED':
        label = 'Delivered & COD Collected';
        defaultLocation = location || target.customerAddress;
        defaultNote = note || `Parcel delivered to ${target.customerName}. ৳${target.codAmount} collected.`;
        break;
      case 'PARTIAL_DELIVERED':
        label = 'Partial Delivery';
        defaultLocation = location || target.customerAddress;
        defaultNote = note || `Customer accepted partial items from consignment.`;
        break;
      case 'RETURNED_TO_ORIGIN':
        label = 'Return to Origin (RTO)';
        defaultLocation = location || 'Fulfillio Return Dock';
        defaultNote = note || `Customer declined delivery. Parcel routed back to warehouse.`;
        break;
      case 'CANCELLED':
        label = 'Consignment Cancelled';
        defaultLocation = location || 'Merchant Request';
        defaultNote = note || `Cancelled before dispatch.`;
        break;
    }

    const checkpoint: TrackingCheckpoint = {
      timestamp: timeStr,
      status: nextStatus,
      statusLabel: label,
      location: defaultLocation,
      notes: defaultNote,
    };

    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();
    target.checkpoints = [...target.checkpoints, checkpoint];

    this.persist();
    return target;
  }

  public generateWebhookPayload(record: ConsignmentRecord): CourierWebhookSimulationPayload {
    return {
      event: `courier.consignment.${record.status.toLowerCase()}`,
      consignment_id: record.consignmentId,
      tracking_code: record.trackingCode,
      status: record.status,
      cod_amount: record.codAmount,
      collected_amount: record.status === 'DELIVERED' ? record.codAmount : 0,
      timestamp: new Date().toISOString(),
      signature: `sim_sig_${Math.random().toString(36).substring(2, 12)}`,
    };
  }

  public resetToDefaults() {
    this.consignments = [...DEFAULT_CONSIGNMENTS];
    this.persist();
  }
}

export const courierSimulator = new CourierSimulatorService();
