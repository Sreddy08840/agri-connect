import api from './api';

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post('/auth/login', payload);
  // Expecting { token, role: 'farmer' | 'customer' }
  return data;
}

export async function signupCustomer(payload: { name: string; email: string; password: string }) {
  const { data } = await api.post('/auth/register/customer', payload);
  return data;
}

export async function signupFarmer(payload: { name: string; email: string; password: string; farmName?: string }) {
  const { data } = await api.post('/auth/register/farmer', payload);
  return data;
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data;
}
