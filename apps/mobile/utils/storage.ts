import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'ac_token';
const ROLE_KEY = 'ac_role';

export async function setToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
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
  await Promise.all([clearToken(), clearUserRole()]);
}
