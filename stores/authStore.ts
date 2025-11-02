'use client';

import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authService } from '@/services/authService';
import type { User } from '@/services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateProfile: (profile: { name?: string; phone?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const COOKIE_OPTIONS = {
  expires: 7,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize with null values - will be hydrated on client
  let token: string | null = null;
  let refreshToken: string | null = null;
  let user: User | null = null;

  // Only access cookies on client side
  if (typeof window !== 'undefined') {
    token = Cookies.get('token') || null;
    refreshToken = Cookies.get('refreshToken') || null;
    const userStr = Cookies.get('user');
    user = userStr ? JSON.parse(userStr) : null;
  }

  return {
    user,
    token,
    refreshToken,
    isLoading: false,
    isAuthenticated: typeof window !== 'undefined' ? (!!user && !!token) : false,

    login: async (email: string, password: string) => {
      try {
        const response = await authService.login({ email, password });
        Cookies.set('token', response.token, COOKIE_OPTIONS);
        Cookies.set('refreshToken', response.refreshToken, COOKIE_OPTIONS);
        Cookies.set('user', JSON.stringify(response.user), COOKIE_OPTIONS);
        set({
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
        });
        
        // Fetch full user info with populated dealer
        try {
          const fullUser = await authService.me();
          Cookies.set('user', JSON.stringify(fullUser), COOKIE_OPTIONS);
          set({ user: fullUser });
        } catch (error) {
          console.error('Failed to fetch full user info:', error);
        }
      } catch (error) {
        throw error;
      }
    },

    logout: () => {
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
      authService.logout().catch(() => {});
    },

    fetchUser: async () => {
      const { token } = get();
      if (!token) {
        set({ isLoading: false });
        return;
      }

      set({ isLoading: true });
      try {
        const user = await authService.me();
        Cookies.set('user', JSON.stringify(user), COOKIE_OPTIONS);
        set({ user, isLoading: false });
      } catch (error) {
        Cookies.remove('token');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },

    updateProfile: async (profile: { name?: string; phone?: string }) => {
      const response = await authService.updateProfile(profile);
      Cookies.set('user', JSON.stringify(response.user), COOKIE_OPTIONS);
      set({ user: response.user });
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      await authService.changePassword(currentPassword, newPassword);
    },
  };
});

