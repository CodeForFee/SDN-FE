import api from "@/lib/api";

export interface Dealer {
  _id: string;
  name: string;
  code: string;
  region: string;
  address: string;
  contacts: {
    name: string;
    phone: string;
    email: string;
    _id: string;
  }[];
  creditLimit: number;
  salesTarget?: number;
  status?: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealerRequest {
  name: string;
  code: string;
  region: string;
  address: string;
  contacts: {
    name: string;
    phone: string;
    email: string;
  }[];
  creditLimit: number;
  status: "active" | "inactive";
}

export interface UpdateSaleTarget {
  salesTarget: number;
}

export const dealerService = {
  getDealers: async (): Promise<Dealer[]> => {
    const response = await api.get("/dealers");
    // Backend returns: { success: true, data: [...], count: ... }
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },

  getDealerById: async (id: string): Promise<Dealer> => {
    const response = await api.get(`/dealers/${id}`);
    // Backend returns: { success: true, data: {...} }
    return response.data?.data || response.data;
  },

  createDealer: async (data: CreateDealerRequest): Promise<Dealer> => {
    const response = await api.post("/dealers", data);
    // Backend returns: { success: true, data: {...}, message: "..." }
    return response.data?.data || response.data;
  },

  updateDealer: async (
    id: string,
    data: Partial<CreateDealerRequest>
  ): Promise<Dealer> => {
    const response = await api.patch(`/dealers/${id}`, data);
    // Backend returns: { success: true, data: {...}, message: "..." }
    return response.data?.data || response.data;
  },

  updateSalesTarget: async (
    id: string,
    data: UpdateSaleTarget
  ): Promise<Dealer> => {
    const response = await api.put(`/dealers/${id}/target`, data);
    // Backend returns: { success: true, data: {...}, message: "..." }
    return response.data?.data || response.data;
  },

  deleteDealer: async (id: string): Promise<void> => {
    await api.delete(`/dealers/${id}`);
  },
};
