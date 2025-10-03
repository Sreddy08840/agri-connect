import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'ac_token';
const ROLE_KEY = 'ac_role';

export async function setToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    console.log('✅ Token saved to storage successfully');
  } catch (error) {
    console.error('❌ Error saving token to storage:', error);
    throw error;
  }
}
export async function getToken() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    console.log('🔍 Getting token from storage:', token ? 'Found' : 'Not found');
    return token;
  } catch (error) {
    console.error('❌ Error getting token from storage:', error);
    return null;
  }
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export type UserRole = 'farmer' | 'customer';
export async function setUserRole(role: UserRole) {
  await SecureStore.setItemAsync(ROLE_KEY, role);
}
export async function getUserRole() {
  return SecureStore.getItemAsync(ROLE_KEY) as Promise<UserRole | null>;
}
export async function clearUserRole() {
  await SecureStore.deleteItemAsync(ROLE_KEY);
}

export async function clearAuth() {
  try {
    console.log('🔄 Clearing authentication data...');
    await clearToken();
    await clearUserRole();
    console.log('✅ Authentication data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    // Continue anyway to ensure logout
  }
}
