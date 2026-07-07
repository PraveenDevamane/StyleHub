import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function AdminLayout() {
  const router = useRouter();
  const segments = useSegments();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const { session, isAdmin, isLoading } = useAuthStore();

  useEffect(() => {
    // Don't navigate while auth state is still being resolved
    if (isLoading) return;

    const inLoginScreen = (segments as string[]).includes('login');

    if (isAdmin && inLoginScreen) {
      // Admin is on the login screen — redirect to dashboard
      router.replace('/admin/dashboard');
    } else if (!isAdmin && !inLoginScreen) {
      // Not an admin and trying to access a protected screen — redirect to login
      router.replace('/admin/login');
    }
  }, [isAdmin, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="products/index" />
      <Stack.Screen name="products/editor" />
      <Stack.Screen name="categories/index" />
      <Stack.Screen name="inventory" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
