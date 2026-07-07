import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, ShoppingBag } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useFavoritesStore } from '@/store/favoritesStore';
import CachedImage from '@/components/CachedImage';
import Button from '@/components/Button';
import { Product } from '@/types';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 52) / 2;

export default function WishlistScreen() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const { favorites, removeFavorite } = useFavoritesStore();

  const renderProductItem = ({ item }: { item: Product }) => {
    const mainImage = item.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400';

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => router.push(`/(customer)/product/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <CachedImage source={{ uri: mainImage }} style={styles.productImage} />
          <TouchableOpacity
            style={[styles.favButton, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }]}
            onPress={() => removeFavorite(item.id)}
          >
            <Heart size={15} color={colors.accent} fill={colors.accent} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.productSub, { color: colors.textSecondary }]}>
          {item.subcategory}
        </Text>
        <Text style={[styles.price, { color: colors.text }]}>${item.price}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>MY WISHLIST</Text>
      </View>

      {/* Favorites List */}
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.backgroundSelected }]}>
            <Heart size={32} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your wishlist is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Save items that you like to view them here later.
          </Text>
          <Button
            title="EXPLORE PRODUCTS"
            onPress={() => router.push('/(customer)/categories')}
            style={styles.exploreBtn}
          />
        </View>
      )}
      <View style={{ height: 80 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
    paddingBottom: 100,
  },
  gridCard: {
    width: COLUMN_WIDTH,
    marginBottom: 12,
    marginRight: 12,
  },
  imageContainer: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.25,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  productSub: {
    fontSize: 11,
    marginBottom: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  exploreBtn: {
    width: '100%',
    maxWidth: 240,
  },
});
