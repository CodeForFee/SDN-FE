import api from '@/lib/api';

export interface Inventory {
  _id: string;
  ownerType: 'EVM' | 'Dealer';
  owner?: string | { _id: string; name?: string; address?: string };
  variant: string | { _id: string; trim?: string; msrp?: number };
  color?: string | { _id: string; name?: string; code?: string };
  quantity: number;
  reserved?: number;
  vinList?: string[];
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInventoryRequest {
  variant: string;
  color?: string;
  owner: string;
  ownerType: 'EVM' | 'Dealer';
  quantity: number;
  location?: string;
}

export interface UpdateInventoryRequest {
  quantity?: number;
  location?: string;
}

export interface TransferInventoryRequest {
  variant: string;
  color?: string;
  fromDealerId: string;
  toDealerId: string;
  quantity: number;
}

export const inventoryService = {
  getInventory: async (): Promise<Inventory[]> => {
    const response = await api.get('/inventory');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getDealerInventory: async (dealerId: string): Promise<Inventory[]> => {
    const response = await api.get(`/inventory/dealer/${dealerId}`);
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  createInventory: async (data: CreateInventoryRequest): Promise<Inventory> => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  updateInventory: async (id: string, data: UpdateInventoryRequest): Promise<Inventory> => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },

  deleteInventory: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },

  transferInventory: async (data: TransferInventoryRequest): Promise<any> => {
    const response = await api.post('/inventory/transfer', data);
    return response.data;
  },
};

