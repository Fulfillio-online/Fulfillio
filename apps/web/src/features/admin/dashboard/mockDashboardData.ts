import { ExecutiveDashboardData, DashboardTimeframe } from './types';

function createEmptyDashboard(timeframe: DashboardTimeframe, timeframeLabel: string): ExecutiveDashboardData {
  return {
    timeframe,
    timeframeLabel,
    summary: {
      totalOrders: 0,
      ordersGrowthPercentage: 0,
      grossRevenue: 0,
      revenueGrowthPercentage: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMarginPercentage: 0,
      isProfitable: true,
      dispatchSlaPercentage: 0,
      avgOrderTurnaroundHours: 0,
    },
    financials: {
      grossRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      netMarginPercentage: 0,
      isProfitable: true,
      revenueStreams: [],
      expenses: [],
      trendVsPriorPeriod: {
        revenue: 0,
        expenses: 0,
        profit: 0,
      },
    },
    timeSeries: [],
    couriers: [],
    warehouseCapacity: [],
    auditFeed: [],
  };
}

export const mockDashboardData: Record<DashboardTimeframe, ExecutiveDashboardData> = {
  today: createEmptyDashboard('today', 'Today'),
  '7d': createEmptyDashboard('7d', 'Last 7 Days'),
  '30d': createEmptyDashboard('30d', 'Last 30 Days'),
  quarter: createEmptyDashboard('quarter', 'This Quarter'),
};
