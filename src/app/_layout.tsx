import React, { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Colors } from '@/constants/theme';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/global.css';
import '@/services/appInsights';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache freshness
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
      refetchOnWindowFocus: false, // Turn off automatic refetching on window focus
      retry: 1, // Only retry failed requests once
    },
  },
});

export default function RootLayout() {
  const theme = useThemeStore((state) => state.theme);
  const themeHydrated = useThemeStore((state) => state.hasHydrated);
  const colors = Colors[theme];
  const setSession = useAuthStore((state) => state.setSession);
  const [appReady, setAppReady] = useState(false);
  const authResolved = useRef(false);

  useEffect(() => {
    // Safety timeout: if Firebase hasn't responded in 5 seconds, show the app anyway
    const safetyTimeout = setTimeout(() => {
      if (!authResolved.current) {
        authResolved.current = true;
        setAppReady(true);
      }
    }, 5000);

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // No cached user — become ready immediately so splash shows fast
        authResolved.current = true;
        setSession(null).finally(() => setAppReady(true));
      } else {
        // Logged-in user — wait for admin check to complete, then become ready
        setSession(firebaseUser).finally(() => {
          authResolved.current = true;
          setAppReady(true);
        });
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [setSession]);

  if (!themeHydrated || !appReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="admin" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
