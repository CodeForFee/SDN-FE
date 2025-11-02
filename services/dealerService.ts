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

export const dealerService = {
  getDealers: async (): Promise<Dealer[]> => {
    const response = await api.get("/dealers");
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },

  getDealerById: async (id: string): Promise<Dealer> => {
    const response = await api.get(`/dealers/${id}`);
    return response.data;
  },

  createDealer: async (data: CreateDealerRequest): Promise<Dealer> => {
    const response = await api.post("/dealers", data);
    return response.data;
  },

  updateDealer: async (
    id: string,
    data: Partial<CreateDealerRequest>
  ): Promise<Dealer> => {
    const response = await api.patch(`/dealers/${id}`, data);
    return response.data;
  },

  deleteDealer: async (id: string): Promise<void> => {
    await api.delete(`/dealers/${id}`);
  },
};
