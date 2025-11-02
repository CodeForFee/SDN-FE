import api from '@/lib/api';

export interface Customer {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  idNumber?: string;
  address?: string;
  segment?: 'retail' | 'fleet';
  notes?: string;
  ownerDealer?: string;
  ownerUser?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  fullName: string;
  phone: string;
  email?: string;
  idNumber?: string;
  address?: string;
  segment?: 'retail' | 'fleet';
  notes?: string;
}

export const customerService = {
  getCustomers: async (): Promise<Customer[]> => {
    const response = await api.get('/customers');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data?.data || response.data;
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: Partial<CreateCustomerRequest>): Promise<Customer> => {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  getCustomerDebt: async (id: string): Promise<{
    customer: {
      _id: string;
      fullName: string;
      phone: string;
      email?: string;
    };
    summary: {
      totalOrders: number;
      totalOrderValue: number;
      totalPaid: number;
      debt: number;
    };
    orders: Array<{
      orderId: string;
      orderNo: string;
      totalAmount: number;
      status: string;
      createdAt: string;
      paidAmount: number;
      debt: number;
      payments: Array<{
        _id: string;
        amount: number;
        paidAt?: string;
      }>;
    }>;
  }> => {
    const response = await api.get(`/customers/${id}/debt`);
    return response.data;
  },
};

