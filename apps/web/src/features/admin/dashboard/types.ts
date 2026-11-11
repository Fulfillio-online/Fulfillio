export type DashboardTimeframe = 'today' | '7d' | '30d' | 'quarter';

export interface RevenueStream {
  id: string;
  name: string;
  amount: number;
  sharePercentage: number;
  changePercentage: number;
  description: string;
}

export interface OperatingExpense {
  id: string;
  name: string;
  amount: number;
  sharePercentage: number;
  changePercentage: number;
  category: 'facilities' | 'logistics' | 'packaging' | 'payroll' | 'tech';
}

export interface FinancialAnalytics {
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  netMarginPercentage: number;
  isProfitable: boolean;
  revenueStreams: RevenueStream[];
  expenses: OperatingExpense[];
  trendVsPriorPeriod: {
    revenue: number;
    expenses: number;
    profit: number;
  };
}

export interface OrderTimeSeriesPoint {
  label: string;
  date: string;
  intake: number;
  wavePicked: number;
  packed: number;
  dispatched: number;
  delivered: number;
  returned: number;
  revenue: number;
  cost: number;
}

export interface CourierPerformance {
  id: string;
  name: string;
  code: 'steadfast' | 'pathao' | 'redx';
  totalParcels: number;
  sharePercentage: number;
  deliveredCount: number;
  deliverySuccessRate: number;
  returnCount: number;
  returnRate: number;
  averageSlaHours: number;
  codInTransitAmount: number;
  codSettledAmount: number;
  activeManifests: number;
  status: 'healthy' | 'delayed' | 'optimal';
}

export interface WarehouseZoneCapacity {
  zoneId: string;
  name: string;
  type: string;
  occupiedSlots: number;
  totalSlots: number;
  occupancyPercentage: number;
  status: 'normal' | 'optimal' | 'warning' | 'critical';
  topSkuCount: number;
  activePickers: number;
}

export interface LiveAuditFeedItem {
  id: string;
  timestamp: string;
  timeAgo: string;
  title: string;
  details: string;
  type: 'wave' | 'packing' | 'dispatch' | 'inbound' | 'settlement' | 'api';
  status: 'success' | 'info' | 'warning';
}

export interface ExecutiveDashboardData {
  timeframe: DashboardTimeframe;
  timeframeLabel: string;
  summary: {
    totalOrders: number;
    ordersGrowthPercentage: number;
    grossRevenue: number;
    revenueGrowthPercentage: number;
    totalExpenses: number;
    netProfit: number;
    profitMarginPercentage: number;
    isProfitable: boolean;
    dispatchSlaPercentage: number;
    avgOrderTurnaroundHours: number;
  };
  financials: FinancialAnalytics;
  timeSeries: OrderTimeSeriesPoint[];
  couriers: CourierPerformance[];
  warehouseCapacity: WarehouseZoneCapacity[];
  auditFeed: LiveAuditFeedItem[];
}
