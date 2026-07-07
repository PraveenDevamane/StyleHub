import React from 'react';
import { StyleSheet, ViewStyle, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 35,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const borderStyle = {
    borderColor: colors.cardBorder,
    borderWidth: 1,
  };

  const shadowStyle = theme === 'light'
    ? {
        shadowColor: '#111111',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
      };

  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    return (
      <BlurView
        intensity={intensity}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={[styles.card, borderStyle, shadowStyle, style]}
      >
        {children}
      </BlurView>
    );
  }

  // Android performance optimization fallback
  const androidBackground = theme === 'dark'
    ? 'rgba(26, 26, 26, 0.92)'
    : 'rgba(255, 255, 255, 0.95)';

  return (
    <View style={[styles.card, { backgroundColor: androidBackground }, borderStyle, shadowStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
});

export default GlassCard;
