import api from "@/lib/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: "DealerStaff" | "DealerManager" | "EVMStaff" | "Admin";
  profile?: {
    name?: string;
    phone?: string;
  };
  dealer?: string;
}

export interface User {
  _id: string;
  email: string;
  role: "DealerStaff" | "DealerManager" | "EVMStaff" | "Admin";
  profile: {
    name?: string;
    phone?: string;
  };
  dealer?:
    | string
    | { _id: string; name?: string; region?: string; address?: string };
}

export interface AuthResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  register: async (
    data: RegisterRequest
  ): Promise<{ message: string; user: User }> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (profile: {
    name?: string;
    phone?: string;
  }): Promise<{ message: string; user: User }> => {
    const response = await api.put("/auth/profile", { profile });
    return response.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const response = await api.put("/auth/password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },
};
