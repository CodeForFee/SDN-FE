import api from '@/lib/api';

export interface VehicleColor {
  _id: string;
  name: string;
  code?: string;
  hex?: string;
  extraPrice?: number;
  active?: boolean;
}

export interface CreateRequest {
  name: string;
  code: string;
  hex: string;
  extraPrice: number;
  active: boolean;
}

export type UpdateRequest = Partial<CreateRequest>;


export const vehicleColorService = {
  list: async (): Promise<VehicleColor[]> => {
    const response = await api.get('/vehicle-colors');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  get: async (id: string): Promise<VehicleColor> => {
    const response = await api.get(`/vehicle-colors/${id}`);
    return response.data?.data || response.data;
  },

  create: async (data: CreateRequest): Promise<VehicleColor> => {
    const response = await api.post('/vehicle-colors', data);
    return response.data?.data || response.data;
  },

  update: async (id: string, data: UpdateRequest): Promise<VehicleColor> => {
    const response = await api.patch(`/vehicle-colors/${id}`, data);
    return response.data?.data || response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/vehicle-colors/${id}`);
  },
};