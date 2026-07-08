/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#24160F',
    background: '#FFF8EF',
    backgroundElement: '#FFFDF8',
    backgroundSelected: '#FFE9CF',
    textSecondary: '#8A7567',
    accent: '#FF6B00',
    border: '#F2D9C0',
    card: '#FFFDF8',
    cardBorder: 'rgba(123, 63, 18, 0.14)',
    tint: '#FFF0DB',
    highlight: '#B45309',
    success: '#C65F00',
    warning: '#F59E0B',
  },
  dark: {
    text: '#FFF7ED',
    background: '#170F1F',
    backgroundElement: '#24172F',
    backgroundSelected: '#35213F',
    textSecondary: '#D7C8DE',
    accent: '#C4B5FD',
    border: '#44304F',
    card: 'rgba(36, 23, 47, 0.9)',
    cardBorder: 'rgba(255, 247, 237, 0.12)',
    tint: '#382452',
    highlight: '#FB923C',
    success: '#6EE7B7',
    warning: '#FBBF24',
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
