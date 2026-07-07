import React from 'react';
import { Tabs } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { Platform } from 'react-native';
import { Home, Compass, Heart, User } from 'lucide-react-native';

export default function CustomerLayout() {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0, top: 0, right: 0, left: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarIconStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          margin: 0,
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 16,
          left: 20,
          right: 20,
          elevation: 6,
          backgroundColor: theme === 'dark' ? 'rgba(26, 26, 26, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: 20,
          height: 64,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: theme === 'dark' ? 0.25 : 0.08,
          shadowRadius: 12,
          paddingBottom: 0,
          paddingTop: 0,
          paddingHorizontal: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          tabBarIcon: ({ color }) => <Compass size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          tabBarIcon: ({ color }) => <Heart size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
      
      {/* Subpages hidden from the tab bar */}
      <Tabs.Screen
        name="product/[id]"
        options={{
          href: null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          href: null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
