import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUpDown, ChevronDown, Filter, Heart } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useCategories, useProducts } from '@/hooks/useProducts';
import { useFavoritesStore } from '@/store/favoritesStore';
import CachedImage from '@/components/CachedImage';
import ShimmerLoader from '@/components/ShimmerLoader';
import { Product } from '@/types';

const MAX_CONTENT_WIDTH = 1480;
const SIDE_PADDING = 28;
const GRID_GAP = 14;
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500';

const SUBCATEGORIES: Record<string, string[]> = {
  footwear: ['Sneakers', 'Formal Shoes', 'Sandals', 'Slippers', 'Sports Shoes', 'Boots', 'Loafers', 'Heels', 'Bellies', 'Kolhapuri'],
  dress: ['Maxi Dress', 'A-Line Dress', 'Bodycon', 'Wrap Dress', 'Shirt Dress', 'Off-Shoulder', 'Cocktail Dress', 'Evening Gown'],
  saree: ['Silk Saree', 'Cotton Saree', 'Chiffon Saree', 'Georgette Saree', 'Banarasi Saree', 'Kanjeevaram', 'Linen Saree', 'Designer Saree'],
  accessories: ['Watches', 'Belts', 'Bags', 'Wallets', 'Sunglasses', 'Hats', 'Jewelry', 'Scarves', 'Hair Accessories', 'Bangles'],
  't-shirts': ['Round Neck', 'V-Neck', 'Polo', 'Oversized', 'Graphic Tees', 'Printed', 'Plain', 'Henley'],
  jeans: ['Slim Fit', 'Straight Fit', 'Skinny', 'Bootcut', 'Wide Leg', 'Ripped', 'High Waist', 'Mom Jeans'],
  kurta: ['Straight Kurta', 'A-Line Kurta', 'Anarkali', 'Kurta Set', 'Pathani', 'Nehru Jacket', 'Sherwani'],
  lehenga: ['Bridal Lehenga', 'Party Wear', 'A-Line Lehenga', 'Circular Lehenga', 'Lehenga Choli', 'Half Saree'],
  shirts: ['Formal Shirts', 'Casual Shirts', 'Linen Shirts', 'Denim Shirts', 'Checked Shirts', 'Printed Shirts'],
  jackets: ['Denim Jacket', 'Leather Jacket', 'Bomber Jacket', 'Windcheater', 'Blazer', 'Puffer Jacket'],
  sportswear: ['Jerseys', 'Track Pants', 'Sports Bra', 'Compression Wear', 'Gym Wear', 'Yoga Wear'],
  winterwear: ['Sweaters', 'Hoodies', 'Coats', 'Thermals', 'Gloves', 'Mufflers', 'Shawls'],
  'kids wear': ['Boys Clothing', 'Girls Clothing', 'Baby Rompers', 'Kids Ethnic', 'School Uniforms', 'Kids Footwear'],
  bags: ['Handbags', 'Backpacks', 'Sling Bags', 'Tote Bags', 'Clutches', 'Laptop Bags', 'Travel Bags'],
  watches: ['Analog', 'Digital', 'Smart Watches', 'Luxury Watches', 'Sports Watches', 'Casual Watches'],
};

function formatPrice(value: number) {
  return `$${value}`;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const { data: categories, isLoading: catLoading } = useCategories();

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  const requestedCategoryId = typeof params.categoryId === 'string' ? params.categoryId : null;
  const activeCatId = selectedCatId ?? requestedCategoryId ?? categories?.[0]?.id ?? null;
  const activeCategoryName = categories?.find((c) => c.id === activeCatId)?.name.toLowerCase() || 'clothing';
  const activeCategoryLabel = categories?.find((c) => c.id === activeCatId)?.name || 'Catalog';
  const subcategoriesList = SUBCATEGORIES[activeCategoryName] || [];

  const { data: products, isLoading: prodLoading } = useProducts({
    categoryId: activeCatId || undefined,
    subcategory: selectedSub || undefined,
    sortBy,
  });

  const shellWidth = Math.max(320, Math.min(width, MAX_CONTENT_WIDTH));
  const columns = width >= 1280 ? 5 : width >= 980 ? 4 : width >= 720 ? 3 : 2;
  const cardWidth = Math.floor((shellWidth - SIDE_PADDING * 2 - GRID_GAP * (columns - 1)) / columns);

  const toggleWishlist = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
    }
  };

  const handleCategorySelect = (id: string) => {
    setSelectedCatId(id);
    setSelectedSub(null);
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const isFav = isFavorite(item.id);
    const mainImage = item.product_images?.[0]?.image_url || FALLBACK_PRODUCT_IMAGE;

    return (
      <TouchableOpacity
        style={[
          styles.gridCard,
          {
            width: cardWidth,
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() => router.push(`/(customer)/product/${item.id}`)}
        activeOpacity={0.88}
      >
        <View style={[styles.imageContainer, { height: Math.round(cardWidth * 1.18), backgroundColor: colors.backgroundSelected }]}>
          <CachedImage source={{ uri: mainImage }} style={styles.productImage} />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Remove from saved items' : 'Save item'}
            style={[styles.favButton, { backgroundColor: colors.backgroundElement }]}
            onPress={() => toggleWishlist(item)}
          >
            <Heart size={16} color={isFav ? colors.highlight : colors.text} fill={isFav ? colors.highlight : 'transparent'} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.productSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.subcategory}
        </Text>
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

  const sortLabel = sortBy === 'newest' ? 'Newest' : sortBy === 'price_asc' ? 'Price low to high' : 'Price high to low';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentShell}>
        <View style={[styles.header, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>Browse</Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{activeCategoryLabel}</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.highlight, borderColor: colors.highlight }]}>
              <Text style={styles.countText}>{products ? products.length : 0} items</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabs}>
            {catLoading ? (
              <>
                <ShimmerLoader width={92} height={36} borderRadius={8} />
                <ShimmerLoader width={110} height={36} borderRadius={8} />
                <ShimmerLoader width={86} height={36} borderRadius={8} />
              </>
            ) : (
              categories?.map((cat) => {
                const isActive = activeCatId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => handleCategorySelect(cat.id)}
                    style={[
                      styles.tabButton,
                      {
                        backgroundColor: isActive ? colors.text : colors.backgroundElement,
                        borderColor: isActive ? colors.text : colors.cardBorder,
                      },
                    ]}
                    activeOpacity={0.86}
                  >
                    <Text style={[styles.tabButtonText, { color: isActive ? colors.background : colors.text }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcategoryTabs}>
            <TouchableOpacity
              onPress={() => setSelectedSub(null)}
              style={[
                styles.chip,
                {
                  backgroundColor: !selectedSub ? colors.accent : colors.backgroundElement,
                  borderColor: !selectedSub ? colors.accent : colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: !selectedSub ? colors.background : colors.text }]}>All</Text>
            </TouchableOpacity>
            {subcategoriesList.map((sub) => {
              const isActive = selectedSub === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  onPress={() => setSelectedSub(isActive ? null : sub)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive ? colors.accent : colors.backgroundElement,
                      borderColor: isActive ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.86}
                >
                  <Text style={[styles.chipText, { color: isActive ? colors.background : colors.text }]}>{sub}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.toolBar, { backgroundColor: colors.tint, borderColor: colors.cardBorder }]}>
            <View style={styles.toolItem}>
              <Filter size={16} color={colors.textSecondary} />
              <Text style={[styles.toolText, { color: colors.textSecondary }]}>
                {selectedSub || 'All styles'}
              </Text>
            </View>
            <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortDropdown((value) => !value)} activeOpacity={0.86}>
              <ArrowUpDown size={15} color={colors.text} />
              <Text style={[styles.sortText, { color: colors.text }]}>{sortLabel}</Text>
              <ChevronDown size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showSortDropdown && (
            <View style={[styles.dropdown, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
              {(['newest', 'price_asc', 'price_desc'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSortBy(option);
                    setShowSortDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      {
                        color: sortBy === option ? colors.accent : colors.text,
                        fontWeight: sortBy === option ? '800' : '600',
                      },
                    ]}
                  >
                    {option === 'newest' ? 'Newest arrivals' : option === 'price_asc' ? 'Price: low to high' : 'Price: high to low'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {prodLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : products && products.length > 0 ? (
        <FlatList
          key={columns}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          contentContainerStyle={[styles.gridContainer, { maxWidth: MAX_CONTENT_WIDTH }]}
          columnWrapperStyle={{ gap: GRID_GAP }}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No products found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Try another category or clear the style filter.
            </Text>
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
    marginTop: 14,
    marginBottom: 10,
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  headerTitleRow: {
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryTabs: {
    gap: 9,
    paddingRight: 2,
  },
  tabButton: {
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  subcategoryTabs: {
    gap: 8,
    paddingRight: 2,
  },
  chip: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toolBar: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  toolText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dropdown: {
    alignSelf: 'flex-end',
    width: 220,
    borderRadius: 8,
    borderWidth: 1,
    padding: 6,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  dropdownText: {
    fontSize: 13,
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
    marginBottom: 0,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 8,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 108,
  },
});
