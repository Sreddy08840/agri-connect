import Constants from 'expo-constants';

export const API_URL: string =
  (Constants.expoConfig?.extra as any)?.apiUrl || (Constants.manifestExtra as any)?.apiUrl || 'http://localhost:3000';
