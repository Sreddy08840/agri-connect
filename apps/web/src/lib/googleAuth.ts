import { api } from './api';

declare global {
  interface Window {
    google: any;
  }
}

export const GOOGLE_CLIENT_ID = '565912943332-bdga9vs4f19r91hr8r99baqng47cqo24.apps.googleusercontent.com';

export function initializeGoogleSignIn(onSuccess: (response: any) => void, onError?: (error: any) => void) {
  if (!window.google) {
    console.error('Google Identity Services not loaded');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: onSuccess,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  window.google.accounts.id.renderButton(
    document.getElementById('google-signin-button'),
    {
      theme: 'outline',
      size: 'large',
      width: 400,
      text: 'continue_with',
      shape: 'rectangular',
    }
  );

  if (onError) {
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        onError(notification);
      }
    });
  }
}

export async function handleGoogleSignIn(credential: string) {
  try {
    // Send the Google JWT credential to your backend
    const response = await api.post('/auth/google', {
      credential,
    });

    // Backend should return our app's tokens
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Update API headers
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    return { success: true, user };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Google sign-in failed'
    };
  }
}