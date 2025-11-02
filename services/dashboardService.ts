import api from '@/lib/api';

export interface DashboardSummary {
  totalSales?: number;
  totalOrders: number;
  totalCustomers?: number;
  totalInventory?: number;
  recentOrders?: any[];
  topVehicles?: any[];
  delivered?: number;
  topDealers?: any[];
  ordersByStatus?: {
    new?: number;
    confirmed?: number;
    allocated?: number;
    invoiced?: number;
    delivered?: number;
    cancelled?: number;
    pending?: number;
    approved?: number;
    processing?: number;
    completed?: number;
    rejected?: number;
  };
  personalStats?: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: any;
  };
  pendingOrders?: number;
  approvedOrders?: number;
  vehicleRequests?: number;
  staffCount?: number;
}

export interface DashboardTrends {
  salesTrend?: { period: string; value: number }[];
  orderTrend?: { period: string; value: number }[];
  monthlyTrends?: any;
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getTrends: async (): Promise<DashboardTrends> => {
    const response = await api.get('/dashboard/trends');
    // Backend returns array of {_id: date, orders: count}
    const data = Array.isArray(response.data) ? response.data : [];
    return {
      orderTrend: data.map((item: any) => ({
        period: item._id,
        value: item.orders || 0,
      })),
    };
  },

  getPersonalStats: async (): Promise<DashboardSummary> => {
    const response = await api.get('/reports/personal', {
      params: { period: 'month' }
    });
    return response.data;
  },
};

