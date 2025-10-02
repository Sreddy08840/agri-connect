import Constants from 'expo-constants';

// API URL is configured in app.config.js and app.json
// Default fallback uses localhost for testing in Expo Go on same machine
export const API_URL: string =
  (Constants.expoConfig?.extra as any)?.apiUrl || (Constants.manifestExtra as any)?.apiUrl || 'http://192.168.30.223:8080/api';
