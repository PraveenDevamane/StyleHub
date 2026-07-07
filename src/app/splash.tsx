import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(25);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 80 });
    logoOpacity.value = withTiming(1, { duration: 700 });

    textOpacity.value = withDelay(400, withTiming(1, { duration: 700 }));
    textTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 100 }));

    const timer = setTimeout(() => {
      router.replace('/(customer)');
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={[styles.logoOutline, { borderColor: colors.accent }]}>
          <Text style={[styles.logoLetter, { color: colors.text }]}>S</Text>
          <View style={[styles.logoDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.logoLetter, { color: colors.text }]}>H</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.brandContainer, textStyle]}>
        <Text style={[styles.brandTitle, { color: colors.text }]}>STYLEHUB</Text>
        <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
          ELEVATE YOUR STYLE
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoOutline: {
    width: 90,
    height: 90,
    borderWidth: 3,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
    paddingHorizontal: 4,
  },
  logoLetter: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -2,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    marginTop: 12,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 4,
  },
});
