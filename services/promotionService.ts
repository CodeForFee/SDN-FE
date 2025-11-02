import api from '@/lib/api';

export interface Promotion {
  _id: string;
  name: string;
  scope: 'global' | 'byDealer' | 'byVariant';
  dealers?: string[] | Array<{ _id: string; name?: string; address?: string }>;
  variants?: string[] | Array<{ _id: string; trim?: string; msrp?: number }>;
  type: 'cashback' | 'accessory' | 'finance';
  value: number;
  stackable: boolean;
  validFrom: string;
  validTo: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromotionRequest {
  name: string;
  scope: 'global' | 'byDealer' | 'byVariant';
  dealers?: string[];
  variants?: string[];
  type: 'cashback' | 'accessory' | 'finance';
  value: number;
  stackable?: boolean;
  validFrom: string;
  validTo: string;
  status?: 'active' | 'inactive';
}

export const promotionService = {
  getPromotions: async (): Promise<Promotion[]> => {
    const response = await api.get('/promotions');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  createPromotion: async (data: CreatePromotionRequest): Promise<Promotion> => {
    const response = await api.post('/promotions', data);
    return response.data?.data || response.data;
  },

  updatePromotion: async (id: string, data: Partial<CreatePromotionRequest>): Promise<Promotion> => {
    const response = await api.put(`/promotions/${id}`, data);
    return response.data?.data || response.data;
  },

  deletePromotion: async (id: string): Promise<void> => {
    await api.delete(`/promotions/${id}`);
  },
};

