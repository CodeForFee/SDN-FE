import api from '@/lib/api';

export interface VehicleModel {
  _id: string;
  name: string;
  brand?: string;
  segment?: string;
  description?: string;
  active?: boolean;
}

export const vehicleModelService = {
  list: async (): Promise<VehicleModel[]> => {
    const response = await api.get('/vehicle-models');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  get: async (id: string): Promise<VehicleModel> => {
    const response = await api.get(`/vehicle-models/${id}`);
    return response.data?.data || response.data;
  },

  create: async (data: Partial<VehicleModel>): Promise<VehicleModel> => {
    const response = await api.post('/vehicle-models', data);
    return response.data?.data || response.data;
  },

  update: async (id: string, data: Partial<VehicleModel>): Promise<VehicleModel> => {
    const response = await api.patch(`/vehicle-models/${id}`, data);
    return response.data?.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/vehicle-models/${id}`);
  },
};

