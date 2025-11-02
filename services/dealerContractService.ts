import api from '@/lib/api';

export interface DealerContract {
  _id: string;
  contractNo: string;
  dealer: string | { _id: string; name?: string; address?: string; region?: string };
  order?: string | { _id: string; orderNo?: string; status?: string };
  contractType: 'distribution' | 'purchase' | 'consignment';
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  signedDate?: string;
  effectiveDate?: string;
  expiryDate?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  terms?: string;
  discountPolicy?: {
    discountRate: number;
    creditLimit: number;
    paymentTerm: number;
  };
  files?: string[];
  createdBy?: string | { _id: string; email?: string; profile?: any };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealerContractRequest {
  orderId?: string;
  dealerId?: string;
  contractType?: 'distribution' | 'purchase' | 'consignment';
  effectiveDate?: string;
  expiryDate?: string;
  terms?: string;
  discountRate?: number;
  creditLimit?: number;
  paymentTerm?: number;
  files?: string[];
  notes?: string;
  totalAmount?: number; // Required if orderId is not provided
}

export interface RecordPaymentRequest {
  amount: number;
  paymentId?: string;
  notes?: string;
}

export const dealerContractService = {
  getDealerContracts: async (params?: {
    dealerId?: string;
    orderId?: string;
    status?: string;
  }): Promise<DealerContract[]> => {
    const response = await api.get('/dealer-contracts', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getDealerContractById: async (id: string): Promise<DealerContract> => {
    const response = await api.get(`/dealer-contracts/${id}`);
    return response.data;
  },

  getDealerContractByOrder: async (orderId: string): Promise<DealerContract> => {
    const response = await api.get(`/dealer-contracts/order/${orderId}`);
    return response.data;
  },

  createDealerContract: async (data: CreateDealerContractRequest): Promise<DealerContract> => {
    const response = await api.post('/dealer-contracts', data);
    return response.data?.data || response.data;
  },

  updateDealerContract: async (id: string, data: Partial<CreateDealerContractRequest>): Promise<DealerContract> => {
    const response = await api.put(`/dealer-contracts/${id}`, data);
    return response.data?.data || response.data;
  },

  recordPayment: async (id: string, data: RecordPaymentRequest): Promise<DealerContract> => {
    const response = await api.put(`/dealer-contracts/${id}/payment`, data);
    return response.data?.data || response.data;
  },
};

