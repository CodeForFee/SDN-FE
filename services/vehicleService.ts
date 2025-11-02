import api from '@/lib/api';

export interface VehicleModel {
  _id: string;
  name: string;
  brand?: string;
  segment?: string;
  description?: string;
  active?: boolean;
}

export interface Vehicle {
  _id: string;
  model: VehicleModel | string; // VehicleModel object when populated
  trim: string; // Variant name
  battery?: string;
  range?: number;
  motorPower?: number;
  features?: string[];
  msrp: number; // Price
  images?: string[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleFilter {
  model?: string;
  variant?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const vehicleService = {
  getVehicles: async (filters?: VehicleFilter): Promise<Vehicle[]> => {
    const response = await api.get('/vehicles', { params: filters });
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data?.data || response.data;
  },

  compareVehicles: async (vehicleIds: string[]): Promise<Vehicle[]> => {
    const response = await api.post('/vehicles/compare', { ids: vehicleIds });
    if (response.data?.data?.vehicles) {
      return response.data.data.vehicles;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.data || [];
  },

  createVehicle: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await api.post('/vehicles', data);
    return response.data;
  },

  updateVehicle: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },

  deleteVehicle: async (id: string): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },
};

