import api from '@/lib/api';

export interface VehicleColor {
  _id: string;
  name: string;
  code?: string;
  hex?: string;
  extraPrice?: number;
  active?: boolean;
}

export const vehicleColorService = {
  list: async (): Promise<VehicleColor[]> => {
    const response = await api.get('/vehicle-colors');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  get: async (id: string): Promise<VehicleColor> => {
    const response = await api.get(`/vehicle-colors/${id}`);
    return response.data?.data || response.data;
  },
};

