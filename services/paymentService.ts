import api from '@/lib/api';

export interface Payment {
  _id: string;
  order: string | { _id: string; orderNo?: string; dealer?: any; customer?: any };
  type: 'deposit' | 'balance' | 'finance';
  amount: number;
  method: 'cash' | 'bank' | 'loan';
  transactionRef?: string;
  paidAt?: string;
  status: 'pending' | 'confirmed' | 'failed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  order: string; // Order ID
  type: 'deposit' | 'balance' | 'finance';
  amount: number;
  method: 'cash' | 'bank' | 'loan';
  transactionRef?: string;
  paidAt?: string; // ISO date string
  notes?: string;
}

export const paymentService = {
  getPayments: async (): Promise<Payment[]> => {
    const response = await api.get('/payments');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getPaymentsByOrder: async (orderId: string): Promise<Payment[]> => {
    const response = await api.get(`/payments/order/${orderId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  getPaymentById: async (id: string): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  createPayment: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  updatePaymentStatus: async (id: string, status: Payment['status']): Promise<Payment> => {
    const response = await api.put(`/payments/${id}/status`, { status });
    return response.data;
  },

  updatePayment: async (id: string, data: Partial<CreatePaymentRequest>): Promise<Payment> => {
    const response = await api.patch(`/payments/${id}`, data);
    return response.data;
  },
};

