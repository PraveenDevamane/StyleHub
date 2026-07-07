import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '@/store/themeStore';

interface ShimmerLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

export const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 650 }),
        withTiming(0.3, { duration: 650 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const backgroundColor = theme === 'dark' ? '#2A2A2A' : '#E2E2E7';

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  shimmer: {
    overflow: 'hidden',
  },
});

export default ShimmerLoader;
