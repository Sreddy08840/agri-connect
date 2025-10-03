import api from './api';

export interface User {
  id: string;
  role: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  address?: string;
  verified: boolean;
  farmerProfile?: {
    id: string;
    businessName: string;
    description?: string;
    address?: string;
    ratingAvg?: number;
    deliveryZones?: string[];
  };
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function updateProfile(updates: {
  name?: string;
  email?: string;
  address?: string;
  farmerProfile?: {
    businessName?: string;
    description?: string;
    address?: string;
  };
}) {
  const { data } = await api.patch('/users/me', updates);
  return data;
}

export async function changePassword(passwordData: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const { data } = await api.patch('/users/me/password', passwordData);
  return data;
}
