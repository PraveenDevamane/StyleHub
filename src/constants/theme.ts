/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111111',
    background: '#FAFAFA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F0F0F0',
    textSecondary: '#777777',
    accent: '#FF6B00',
    border: '#E5E5E5',
    card: '#FFFFFF',
    cardBorder: 'rgba(17, 17, 17, 0.05)',
  },
  dark: {
    text: '#FFFFFF',
    background: '#111111',
    backgroundElement: '#1A1A1A',
    backgroundSelected: '#2C2C2C',
    textSecondary: '#A0A0A0',
    accent: '#FF6B00',
    border: '#2A2A2A',
    card: 'rgba(26, 26, 26, 0.8)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
