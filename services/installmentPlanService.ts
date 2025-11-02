import api from '@/lib/api';

export interface InstallmentPayment {
  _id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'skipped';
  paidAt?: string;
  paymentId?: string | any;
  notes?: string;
}

export interface InstallmentPlan {
  _id: string;
  order: string | { _id: string; orderNo?: string; status?: string; paymentMethod?: string };
  customer: string | { _id: string; fullName?: string; phone?: string; email?: string };
  dealer: string | { _id: string; name?: string; address?: string };
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentCount: number;
  installmentPeriod: 'monthly' | 'quarterly' | 'yearly';
  payments: InstallmentPayment[];
  startDate: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstallmentPlanRequest {
  orderId: string;
  installmentCount?: number;
  installmentPeriod?: 'monthly' | 'quarterly' | 'yearly';
  startDate?: string;
  notes?: string;
}

export interface UpdateInstallmentPaymentRequest {
  installmentPaymentId: string;
  paymentId?: string;
  status?: 'pending' | 'paid' | 'overdue' | 'skipped';
  paidAt?: string;
  notes?: string;
}

export const installmentPlanService = {
  getInstallmentPlans: async (params?: {
    customerId?: string;
    orderId?: string;
    status?: string;
  }): Promise<InstallmentPlan[]> => {
    const response = await api.get('/installment-plans', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getInstallmentPlanById: async (id: string): Promise<InstallmentPlan> => {
    const response = await api.get(`/installment-plans/${id}`);
    return response.data;
  },

  getInstallmentPlanByOrder: async (orderId: string): Promise<InstallmentPlan> => {
    const response = await api.get(`/installment-plans/order/${orderId}`);
    return response.data;
  },

  createInstallmentPlan: async (data: CreateInstallmentPlanRequest): Promise<InstallmentPlan> => {
    const response = await api.post('/installment-plans', data);
    return response.data?.data || response.data;
  },

  updateInstallmentPayment: async (
    id: string,
    data: UpdateInstallmentPaymentRequest
  ): Promise<InstallmentPlan> => {
    const response = await api.put(`/installment-plans/${id}/payment`, data);
    return response.data?.data || response.data;
  },
};

