import api from '@/lib/api';

export const reportService = {
  getPersonalReport: async (period: string = 'month'): Promise<any> => {
    const response = await api.get('/reports/personal', { params: { period } });
    return response.data;
  },

  getSalesReport: async (params?: { period?: string; dealerId?: string }): Promise<any> => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },

  getDebtReport: async (): Promise<any> => {
    const response = await api.get('/reports/debt');
    return response.data;
  },

  getInventoryReport: async (): Promise<any> => {
    const response = await api.get('/reports/inventory');
    return response.data;
  },
};

