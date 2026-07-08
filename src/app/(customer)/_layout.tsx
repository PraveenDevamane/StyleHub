import React from 'react';
import { Tabs } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { Platform, useWindowDimensions, Pressable } from 'react-native';
import { Heart, Home, Search, User } from 'lucide-react-native';

export default function CustomerLayout() {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const { width } = useWindowDimensions();
  const showLabel = width >= 640;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: showLabel,
        tabBarActiveBackgroundColor: theme === 'dark' ? 'rgba(251, 146, 60, 0.16)' : 'rgba(255, 107, 0, 0.14)',
        tabBarButton: (props) => (
          <Pressable
            {...props}
            style={[
              props.style,
              {
                borderRadius: 12,
                overflow: 'hidden',
              }
            ]}
          />
        ),
        safeAreaInsets: { bottom: 0, top: 0, right: 0, left: 0 },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: 58,
          marginVertical: 8,
          marginHorizontal: 6,
          borderRadius: 12,
          paddingBottom: showLabel ? 6 : 0,
          paddingTop: showLabel ? 6 : 0,
          overflow: 'hidden',
          ...Platform.select({
            web: {
              outlineStyle: 'none',
              outlineWidth: 0,
            },
            default: {},
          }),
        },
        tabBarIconStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          margin: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 10,
          backgroundColor: theme === 'dark' ? 'rgba(36, 23, 47, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          borderRadius: 0,
          height: Platform.OS === 'ios' ? 86 : 78,
          borderWidth: 0,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          shadowColor: theme === 'dark' ? '#000000' : '#FF6B00',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: theme === 'dark' ? 0.28 : 0.12,
          shadowRadius: 20,
          paddingBottom: 0,
          paddingTop: 0,
          paddingHorizontal: Platform.OS === 'web' ? 26 : 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => <Search size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <Heart size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
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
