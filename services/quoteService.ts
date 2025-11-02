import api from '@/lib/api';

export interface Quote {
  _id: string;
  dealer?: string | { _id: string; name?: string; region?: string };
  sales?: string | any;
  customer: string | { _id: string; fullName?: string; name?: string; email?: string; phone?: string };
  items?: Array<{
    variant: string | { _id: string; trim?: string; msrp?: number };
    color?: string | { _id: string; name?: string; code?: string };
    qty: number;
    unitPrice: number;
    promotionApplied?: string[];
  }>;
  subtotal?: number;
  discount?: number;
  promotionTotal?: number;
  fees?: {
    registration?: number;
    plate?: number;
    delivery?: number;
  };
  total?: number;
  totalPrice?: number;
  vehicle?: string;
  color?: string;
  promotion?: string;
  validUntil?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  variant: string; // VehicleVariant ID
  color?: string; // VehicleColor ID
  qty: number;
  unitPrice: number;
  promotionApplied?: string[];
}

export interface CreateQuoteRequest {
  customer: string; // Customer ID
  items: QuoteItem[];
  subtotal?: number;
  discount?: number;
  promotionTotal?: number;
  fees?: {
    registration?: number;
    plate?: number;
    delivery?: number;
  };
  total: number;
  validUntil?: string; // ISO date string
  notes?: string;
}

export const quoteService = {
  getQuotes: async (): Promise<Quote[]> => {
    const response = await api.get('/quotes');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getQuoteById: async (id: string): Promise<Quote> => {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
  },

  createQuote: async (data: CreateQuoteRequest): Promise<Quote> => {
    const response = await api.post('/quotes', data);
    return response.data;
  },

  updateQuote: async (id: string, data: { quotedPrice?: number; validUntil?: string; status?: Quote['status']; notes?: string }): Promise<Quote> => {
    const response = await api.patch(`/quotes/${id}`, data);
    return response.data;
  },

  deleteQuote: async (id: string): Promise<void> => {
    await api.delete(`/quotes/${id}`);
  },

  convertQuote: async (id: string): Promise<{ order: any; message: string }> => {
    const response = await api.put(`/quotes/${id}/convert`);
    return response.data;
  },

  approveQuote: async (id: string, notes?: string): Promise<Quote> => {
    const response = await api.put(`/quotes/${id}/approve`, { notes });
    return response.data?.data || response.data;
  },

  rejectQuote: async (id: string, reason: string): Promise<Quote> => {
    const response = await api.put(`/quotes/${id}/reject`, { reason });
    return response.data?.data || response.data;
  },
};

