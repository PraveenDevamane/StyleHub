import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Heart } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useFavoritesStore } from '@/store/favoritesStore';
import CachedImage from '@/components/CachedImage';
import Button from '@/components/Button';
import { Product } from '@/types';

const MAX_CONTENT_WIDTH = 1480;
const SIDE_PADDING = 28;
const GRID_GAP = 14;
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500';

function formatPrice(value: number) {
  return `$${value}`;
}

export default function WishlistScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const { favorites, removeFavorite } = useFavoritesStore();

  const shellWidth = Math.max(320, Math.min(width, MAX_CONTENT_WIDTH));
  const columns = width >= 1280 ? 5 : width >= 980 ? 4 : width >= 720 ? 3 : 2;
  const cardWidth = Math.floor((shellWidth - SIDE_PADDING * 2 - GRID_GAP * (columns - 1)) / columns);

  const renderProductItem = ({ item }: { item: Product }) => {
    const mainImage = item.product_images?.[0]?.image_url || FALLBACK_PRODUCT_IMAGE;

    return (
      <TouchableOpacity
        style={[styles.gridCard, { width: cardWidth, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => router.push(`/(customer)/product/${item.id}`)}
        activeOpacity={0.88}
      >
        <View style={[styles.imageContainer, { height: Math.round(cardWidth * 1.18), backgroundColor: colors.backgroundSelected }]}>
          <CachedImage source={{ uri: mainImage }} style={styles.productImage} />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Remove from saved items"
            style={[styles.favButton, { backgroundColor: colors.backgroundElement }]}
            onPress={() => removeFavorite(item.id)}
          >
            <Heart size={16} color={colors.highlight} fill={colors.highlight} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.productSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.subcategory}
        </Text>
        {item.product_code ? (
          <Text style={[styles.productCode, { color: colors.accent }]} numberOfLines={1}>
            Code: {item.product_code}
          </Text>
        ) : null}
        <View style={styles.priceContainer}>
          {item.discounted_price ? (
            <>
              <Text style={[styles.price, { color: colors.highlight }]}>{formatPrice(item.discounted_price)}</Text>
              <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>{formatPrice(item.price)}</Text>
            </>
          ) : (
            <Text style={[styles.price, { color: colors.text }]}>{formatPrice(item.price)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentShell}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>Saved</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Your wishlist</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: colors.tint, borderColor: colors.cardBorder }]}>
            <Text style={[styles.countText, { color: colors.text }]}>{favorites.length} items</Text>
          </View>
        </View>
      </View>

      {favorites.length > 0 ? (
        <FlatList
          key={columns}
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          contentContainerStyle={[styles.gridContainer, { maxWidth: MAX_CONTENT_WIDTH }]}
          columnWrapperStyle={{ gap: GRID_GAP }}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.tint }]}>
              <Heart size={30} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved products yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap the heart on any product to keep it close while you compare styles.
            </Text>
            <Button
              title="Browse catalog"
              onPress={() => router.push('/(customer)/categories')}
              variant="accent"
              style={styles.exploreBtn}
            />
            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={() => router.push('/(customer)')}
              activeOpacity={0.86}
            >
              <Text style={[styles.secondaryLinkText, { color: colors.text }]}>Back to home</Text>
              <ArrowRight size={15} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.bottomSpacer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentShell: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: SIDE_PADDING,
  },
  header: {
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  countBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
  },
  gridContainer: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 12,
    paddingBottom: 116,
    gap: GRID_GAP,
  },
  gridCard: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  productSub: {
    fontSize: 12,
    marginBottom: 4,
  },
  productCode: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
  },
  priceContainer: {
    minHeight: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  exploreBtn: {
    width: '100%',
    maxWidth: 260,
  },
  secondaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    padding: 8,
  },
  secondaryLinkText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bottomSpacer: {
    height: 80,
  },
});
