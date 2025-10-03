import axios from 'axios';
import { API_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

console.log('📡 API Base URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    console.log('🔑 Token retrieved:', token ? 'Present' : 'Missing');
    if (token) {
      // Ensure headers object exists and is properly formatted
      config.headers = config.headers || {};
      // Use proper header assignment to avoid format issues
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['Content-Type'] = 'application/json';
      console.log('🔑 Authorization header set for:', config.url);
    } else {
      console.log('⚠️ No token found for request to:', config.url);
    }
  } catch (error) {
    console.error('❌ Error getting token:', error);
  }
  return config;
}, (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Detailed error logging for debugging
    if (err.code === 'ECONNABORTED') {
      console.error('❌ Request timeout - Server took too long to respond');
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      console.error('❌ Network Error - Cannot reach server at:', API_URL);
      console.error('Make sure backend is running at http://192.168.30.223:8080');
      return Promise.reject(new Error('Cannot connect to server. Check if backend is running.'));
    }
    
    // Log for debugging
    console.error('API Error:', {
      status: err?.response?.status,
      message: err?.response?.data?.message || err.message,
      url: err?.config?.url,
    });
    
    // Normalize error message
    const message = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

export default api;
