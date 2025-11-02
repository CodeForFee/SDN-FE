import api from '@/lib/api';

export interface VehicleRequestItem {
  variant: string | { _id: string; trim?: string; msrp?: number; model?: string | { _id: string; name?: string; brand?: string } };
  color?: string | { _id: string; name?: string; code?: string };
  quantity: number;
  reason?: string;
}

export interface VehicleRequest {
  _id: string;
  requestNo?: string;
  dealer: string | { _id: string; name?: string; region?: string; address?: string };
  requestedBy: string | { _id: string; email?: string; profile?: { name?: string } };
  reviewedBy?: string | { _id: string; email?: string; profile?: { name?: string } };
  items: VehicleRequestItem[];
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
  requestedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  notes?: string;
  logs?: Array<{ at: string; by: string; action: string; note: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleRequestRequest {
  items: VehicleRequestItem[];
  notes?: string;
}

export const vehicleRequestService = {
  getVehicleRequests: async (status?: string): Promise<VehicleRequest[]> => {
    const response = await api.get('/vehicle-requests', { params: { status } });
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getVehicleRequestById: async (id: string): Promise<VehicleRequest> => {
    const response = await api.get(`/vehicle-requests/${id}`);
    return response.data?.data || response.data;
  },

  createVehicleRequest: async (data: CreateVehicleRequestRequest): Promise<VehicleRequest> => {
    const response = await api.post('/vehicle-requests', data);
    return response.data?.data || response.data;
  },

  approveVehicleRequest: async (id: string, notes?: string): Promise<VehicleRequest> => {
    const response = await api.put(`/vehicle-requests/${id}/approve`, { notes });
    return response.data?.data || response.data;
  },

  rejectVehicleRequest: async (id: string, reason: string): Promise<VehicleRequest> => {
    const response = await api.put(`/vehicle-requests/${id}/reject`, { reason });
    return response.data?.data || response.data;
  },

  cancelVehicleRequest: async (id: string): Promise<VehicleRequest> => {
    const response = await api.put(`/vehicle-requests/${id}/cancel`);
    return response.data?.data || response.data;
  },
};

