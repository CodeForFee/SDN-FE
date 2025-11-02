import api from '@/lib/api';
import { User } from './authService';

export const userService = {
  listUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getDealerStaff: async (): Promise<User[]> => {
    // Use /users endpoint and filter will be done in component
    const response = await api.get('/users');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

