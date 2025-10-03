import api from './api';

// Backend uses password + OTP 2-step flow under /api/auth

// Step 1: login with phone+password -> returns { pendingSessionId, code? }
export async function loginPassword(payload: { phone: string; password: string }) {
  const { data } = await api.post('/auth/login-password', payload);
  return data as { success?: boolean; pendingSessionId: string; code?: string };
}

// Step 1 (register): name, phone, password, role -> returns { pendingSessionId, code? }
export async function registerPassword(payload: { name: string; phone: string; password: string; role: 'CUSTOMER' | 'FARMER' }) {
  const { data } = await api.post('/auth/register-password', payload);
  return data as { success?: boolean; pendingSessionId: string; code?: string };
}

// Step 2: verify OTP for 2FA -> returns { accessToken, refreshToken, user }
export async function verify2FA(payload: { pendingSessionId: string; code: string }) {
  const { data } = await api.post('/auth/otp/verify-2fa', payload);
  return data as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; role: 'CUSTOMER' | 'FARMER' | 'ADMIN'; name?: string | null };
  };
}

// Backward-compatible helpers expected by some screens
export async function login(_payload: { email?: string; phone?: string; password: string }) {
  const phone = _payload.phone || '';
  return loginPassword({ phone, password: _payload.password });
}

export async function signupCustomer(payload: { name: string; phone: string; password: string }) {
  return registerPassword({ name: payload.name, phone: payload.phone, password: payload.password, role: 'CUSTOMER' });
}

export async function signupFarmer(payload: { name: string; phone: string; password: string; farmName?: string }) {
  // farmName is currently unused by backend; kept for UI compatibility
  return registerPassword({ name: payload.name, phone: payload.phone, password: payload.password, role: 'FARMER' });
}

export async function forgotPassword(payload: { phone: string }) {
  const { data } = await api.post('/auth/password/forgot', payload);
  return data as { success?: boolean; pendingSessionId: string; code?: string };
}

export async function resetPassword(payload: { pendingSessionId: string; code: string; newPassword: string }) {
  const { data } = await api.post('/auth/password/reset', payload);
  return data as { success?: boolean; message?: string };
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data;
}
