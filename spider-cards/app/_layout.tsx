import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../src/lib/supabase';
import { font, palette } from '../src/lib/theme';
import type { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === 'sign-in';
    if (!session && !inAuth) router.replace('/sign-in');
    if (session && inAuth) router.replace('/');
  }, [ready, session, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: palette.voidBlack },
            headerTintColor: palette.bone,
            headerTitleStyle: {
              fontFamily: font.title,
              fontWeight: '700',
              color: palette.bone,
            },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: palette.voidBlack },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="card/[id]" options={{ title: 'Card' }} />
          <Stack.Screen name="species/[id]" options={{ title: 'Species' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
