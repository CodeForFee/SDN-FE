import api from '@/lib/api';

export interface Order {
  _id: string;
  orderNo?: string;
  customer: string | { _id: string; fullName?: string; name?: string; email?: string; phone?: string };
  dealer: string | { _id: string; name?: string; address?: string; region?: string };
  sales?: string | any;
  items?: Array<{
    variant: string | { _id: string; trim?: string; msrp?: number };
    color?: string | { _id: string; name?: string; code?: string };
    qty: number;
    unitPrice: number;
    vins?: string[];
  }>;
  totalAmount?: number;
  paymentMethod: 'cash' | 'finance' | 'installment';
  deposit?: number;
  status: 'new' | 'confirmed' | 'allocated' | 'invoiced' | 'delivered' | 'cancelled' | 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  payment?: string;
  delivery?: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  quote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  variant: string; // VehicleVariant ID
  color?: string; // VehicleColor ID
  qty: number;
  unitPrice: number;
}

export interface CreateOrderRequest {
  customer: string; // Customer ID
  items: OrderItem[];
  paymentMethod: 'cash' | 'finance';
  deposit?: number;
  expectedDelivery?: string; // ISO date string
}

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data?.data || response.data;
  },

  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data?.data || response.data;
  },

  updateOrder: async (id: string, data: Partial<CreateOrderRequest>): Promise<Order> => {
    const response = await api.patch(`/orders/${id}`, data);
    return response.data;
  },

  deleteOrder: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  updateOrderStatus: async (id: string, status: Order['status']): Promise<Order> => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },

  approveOrder: async (id: string): Promise<Order> => {
    const response = await api.put(`/orders/${id}/approve`);
    return response.data;
  },

  rejectOrder: async (id: string, reason?: string): Promise<Order> => {
    const response = await api.put(`/orders/${id}/reject`, { reason });
    return response.data;
  },

  allocateOrder: async (id: string, notes?: string, expectedDelivery?: string): Promise<Order> => {
    const response = await api.put(`/orders/${id}/allocate`, { notes, expectedDelivery });
    return response.data?.data || response.data;
  },

  rejectOrderByEVM: async (id: string, reason: string): Promise<Order> => {
    const response = await api.put(`/orders/${id}/reject-by-evm`, { reason });
    return response.data?.data || response.data;
  },
};

