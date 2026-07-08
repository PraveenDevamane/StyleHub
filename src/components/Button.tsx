/* eslint-disable react-hooks/immutability */
'use no memo';
import React from 'react';
import { StyleSheet, Text, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 220 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 220 });
    }
  };

  let buttonStyle: ViewStyle = {};
  let textColor = '#FFFFFF';

  switch (variant) {
    case 'primary':
      buttonStyle = {
        backgroundColor: colors.text,
      };
      textColor = colors.background;
      break;
    case 'secondary':
      buttonStyle = {
        backgroundColor: colors.backgroundSelected,
      };
      textColor = colors.text;
      break;
    case 'accent':
      buttonStyle = {
        backgroundColor: colors.accent,
      };
      textColor = theme === 'dark' ? colors.background : '#FFFFFF';
      break;
    case 'outline':
      buttonStyle = {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.border,
      };
      textColor = colors.text;
      break;
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        buttonStyle,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
