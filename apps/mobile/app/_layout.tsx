// MUST BE FIRST: Setup require.context polyfill before expo-router processes routes
import '../setup-require-context';

import React, { useEffect, useMemo, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { getToken, getUserRole } from '../utils/storage';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [role, setRole] = useState<'farmer' | 'customer' | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const r = await getUserRole();
      setIsAuthed(!!token);
      setRole((r as any) || null);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    if (!isAuthed) {
      if (!inAuthGroup) router.replace('/login');
      return;
    }
    if (isAuthed && !inAuthGroup) return;
    // Redirect to role home
    if (role === 'farmer') router.replace('/farmer');
    else router.replace('/customer');
  }, [ready, isAuthed, role, segments]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {ready ? (
          <Slot />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
