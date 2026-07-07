import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Filter, ArrowUpDown, ChevronDown, Grid, Heart } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useCategories, useProducts } from '@/hooks/useProducts';
import { useFavoritesStore } from '@/store/favoritesStore';
import CachedImage from '@/components/CachedImage';
import ShimmerLoader from '@/components/ShimmerLoader';
import { Product } from '@/types';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 52) / 2; // 2 Columns with padding

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

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  // Fetch categories from DB
  const { data: categories, isLoading: catLoading } = useCategories();

  // Active Category & Filters State
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  // On mount or param change, select the initial category if passed from home
  useEffect(() => {
    if (categories && categories.length > 0) {
      if (params.categoryId) {
        setSelectedCatId(params.categoryId as string);
      } else {
        setSelectedCatId(categories[0].id);
      }
    }
  }, [categories, params.categoryId]);

  // Determine current active main category type (clothing vs footwear)
  const activeCategoryName = categories?.find((c) => c.id === selectedCatId)?.name.toLowerCase() || 'clothing';
  const subcategoriesList = SUBCATEGORIES[activeCategoryName] || [];

  // Fetch products based on filters
  const { data: products, isLoading: prodLoading, refetch } = useProducts({
    categoryId: selectedCatId || undefined,
    subcategory: selectedSub || undefined,
    sortBy: sortBy,
  });

  const toggleWishlist = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const isFav = isFavorite(item.id);
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
            onPress={() => toggleWishlist(item)}
          >
            <Heart size={15} color={isFav ? colors.accent : colors.text} fill={isFav ? colors.accent : 'transparent'} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.productSub, { color: colors.textSecondary }]}>
          {item.subcategory}
        </Text>
        <View style={styles.priceContainer}>
          {item.discounted_price ? (
            <>
              <Text style={[styles.price, { color: colors.accent }]}>${item.discounted_price}</Text>
              <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>${item.price}</Text>
            </>
          ) : (
            <Text style={[styles.price, { color: colors.text }]}>${item.price}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleCategorySelect = (id: string) => {
    setSelectedCatId(id);
    setSelectedSub(null); // Reset subcategory when switching main category
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Category selector header */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 48 }}
        contentContainerStyle={styles.topHeaderContent}
      >
        {catLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 20 }} />
        ) : (
          categories?.map((cat) => {
            const isActive = selectedCatId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategorySelect(cat.id)}
                style={[
                  styles.tabButton,
                  isActive && { borderBottomColor: colors.text, borderBottomWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: isActive ? colors.text : colors.textSecondary },
                  ]}
                >
                  {cat.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Subcategories Horizontal Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subScroll}
        >
          <TouchableOpacity
            onPress={() => setSelectedSub(null)}
            style={[
              styles.chip,
              { backgroundColor: !selectedSub ? colors.text : colors.backgroundSelected },
            ]}
          >
            <Text style={[styles.chipText, { color: !selectedSub ? colors.background : colors.text }]}>
              All
            </Text>
          </TouchableOpacity>
          {subcategoriesList.map((sub) => {
            const isActive = selectedSub === sub;
            return (
              <TouchableOpacity
                key={sub}
                onPress={() => setSelectedSub(isActive ? null : sub)}
                style={[
                  styles.chip,
                  { backgroundColor: isActive ? colors.text : colors.backgroundSelected },
                ]}
              >
                <Text style={[styles.chipText, { color: isActive ? colors.background : colors.text }]}>
                  {sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort & Grid Tools bar */}
      <View style={[styles.toolBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => setShowSortDropdown(!showSortDropdown)}
        >
          <ArrowUpDown size={14} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={[styles.toolText, { color: colors.text }]}>
            {sortBy === 'newest' ? 'Newest' : sortBy === 'price_asc' ? 'Price: Low-High' : 'Price: High-Low'}
          </Text>
          <ChevronDown size={12} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {products ? `${products.length} Items` : '0 Items'}
        </Text>
      </View>

      {/* Sort Dropdown Dialog */}
      {showSortDropdown && (
        <View style={[styles.dropdown, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
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
                    fontWeight: sortBy === option ? '700' : '400',
                  },
                ]}
              >
                {option === 'newest' ? 'Newest Arrivals' : option === 'price_asc' ? 'Price: Low to High' : 'Price: High to Low'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Product Grid */}
      {prodLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : products && products.length > 0 ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No products found in this category.
          </Text>
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
  topHeader: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  topHeaderContent: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tabButton: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  filterSection: {
    paddingVertical: 12,
  },
  subScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toolBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toolText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  countText: {
    fontSize: 12,
  },
  dropdown: {
    position: 'absolute',
    top: 130,
    left: 20,
    zIndex: 10,
    width: 200,
    borderRadius: 8,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 13,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
