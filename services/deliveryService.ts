import api from '@/lib/api';

export interface Delivery {
  _id: string;
  order: string | { _id: string; orderNo?: string; dealer?: any; customer?: any };
  address?: string;
  scheduledAt?: string;
  status: 'pending' | 'in_progress' | 'delivered';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryRequest {
  order: string; // Order ID
  address?: string;
  scheduledAt?: string; // ISO date string
  notes?: string;
}

export const deliveryService = {
  getDeliveries: async (): Promise<Delivery[]> => {
    const response = await api.get('/deliveries');
    // Backend trả về { success: true, data: [...] } hoặc array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data?.success && response.data?.data) {
      return Array.isArray(response.data.data) ? response.data.data : [];
    }
    return [];
  },

  getDeliveryByOrder: async (orderId: string): Promise<Delivery[]> => {
    const response = await api.get(`/deliveries/${orderId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  createDelivery: async (data: CreateDeliveryRequest): Promise<Delivery> => {
    const response = await api.post('/deliveries', data);
    return response.data;
  },

  updateDeliveryStatus: async (id: string, status: Delivery['status'], notes?: string): Promise<Delivery> => {
    const response = await api.put(`/deliveries/${id}/status`, { status, notes });
    return response.data;
  },
};

