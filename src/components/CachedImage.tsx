import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

interface CachedImageProps extends ImageProps {
  showLoader?: boolean;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  source,
  style,
  showLoader = false,
  contentFit = 'cover',
  transition = 300,
  ...props
}) => {
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  const [loading, setLoading] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        transition={transition}
        cachePolicy="disk"
        onLoadStart={() => {
          if (showLoader) setLoading(true);
        }}
        onLoadEnd={() => {
          if (showLoader) setLoading(false);
        }}
        {...props}
      />
      {loading && showLoader && (
        <View style={[styles.loaderContainer, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }]}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default CachedImage;
