import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  role: 'CUSTOMER' | 'FARMER' | 'ADMIN';
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string | null;
  address?: any;
  verified: boolean;
  farmerProfile?: {
    businessName: string;
    ratingAvg: number;
    paused: boolean;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  
  setUser: (user) => {
    set({ user, isLoading: false });
    AsyncStorage.setItem('user', JSON.stringify(user));
  },
  
  clearUser: () => {
    set({ user: null, isLoading: false });
    AsyncStorage.removeItem('user');
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setInitialized: (isInitialized) => set({ isInitialized }),
  
  loadUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        set({ user, isLoading: false, isInitialized: true });
      } else {
        set({ user: null, isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    set({ user: null });
  },
}));
