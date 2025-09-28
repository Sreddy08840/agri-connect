import { User } from '../stores/authStore';

export const getRedirectPath = (user: User | null): string => {
  if (!user) return '/';
  
  switch (user.role) {
    case 'FARMER':
      return '/farmer/dashboard';
    case 'ADMIN':
      // Redirect admin users to the dedicated admin-portal
      window.location.href = 'http://localhost:5174/dashboard';
      return '/home'; // Fallback, though redirect should happen
    case 'CUSTOMER':
    default:
      return '/home';
  }
};

export const getLoginPath = (role?: 'FARMER' | 'CUSTOMER'): string => {
  switch (role) {
    case 'FARMER':
      return '/farmer-login';
    case 'CUSTOMER':
    default:
      return '/login';
  }
};

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  
  try {
    // Basic token validation - check if it's not expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};
