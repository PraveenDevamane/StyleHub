import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Search, ArrowRight, Heart } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import {
  useCategories,
  useFeaturedProducts,
  useNewArrivals,
  useTrendingProducts,
} from '@/hooks/useProducts';
import { useFavoritesStore } from '@/store/favoritesStore';
import CachedImage from '@/components/CachedImage';
import ShimmerLoader from '@/components/ShimmerLoader';
import GlassCard from '@/components/GlassCard';
import { Product } from '@/types';

const { width } = Dimensions.get('window');

const HERO_BANNERS = [
  {
    id: '1',
    title: 'THE NEW STANDARD',
    subtitle: 'Fall/Winter Collection 2026',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
  },
  {
    id: '2',
    title: 'STREET STYLE ESCAPE',
    subtitle: 'Exclusive Sneakers & Footwear',
    image: 'https://images.unsplash.com/photo-1449247709967-d4461a68b201?w=800',
  },
  {
    id: '3',
    title: 'TIMELESS LUXURY',
    subtitle: 'Up to 30% Off Premium Traditional Wear',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const { data: categories, isLoading: catLoading, refetch: refetchCats } = useCategories();
  const { data: featured, isLoading: featLoading, refetch: refetchFeat } = useFeaturedProducts();
  const { data: newArrivals, isLoading: newLoading, refetch: refetchNew } = useNewArrivals();
  const { data: trending, isLoading: trendLoading, refetch: refetchTrend } = useTrendingProducts();

  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCats(), refetchFeat(), refetchNew(), refetchTrend()]);
    setRefreshing(false);
  };

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
        style={styles.productCard}
        onPress={() => router.push(`/(customer)/product/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <CachedImage source={{ uri: mainImage }} style={styles.productImage} />
          <TouchableOpacity
            style={[styles.favButton, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }]}
            onPress={() => toggleWishlist(item)}
          >
            <Heart size={16} color={isFav ? colors.accent : colors.text} fill={isFav ? colors.accent : 'transparent'} />
          </TouchableOpacity>
          {item.discounted_price && (
            <View style={[styles.tag, { backgroundColor: colors.accent }]}>
              <Text style={styles.tagText}>SALE</Text>
            </View>
          )}
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

  const renderSkeletonList = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 20 }}
    >
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.productCard}>
          <ShimmerLoader height={200} borderRadius={12} style={{ marginBottom: 8 }} />
          <ShimmerLoader width="70%" height={14} style={{ marginBottom: 4 }} />
          <ShimmerLoader width="40%" height={12} style={{ marginBottom: 6 }} />
          <ShimmerLoader width="30%" height={14} />
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logoText, { color: colors.text }]}>STYLE<Text style={{ color: colors.accent }}>HUB</Text></Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/search')} style={[styles.searchButton, { backgroundColor: colors.backgroundSelected }]}>
            <Search size={18} color={colors.textSecondary} />
            <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>Search products...</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Banner Carousel (Single View or Horizontal Slider) */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.carouselContainer}
        >
          {HERO_BANNERS.map((banner) => (
            <View key={banner.id} style={styles.bannerSlide}>
              <CachedImage source={{ uri: banner.image }} style={styles.bannerImage} />
              <View style={styles.bannerOverlay} />
              <View style={styles.bannerContent}>
                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <TouchableOpacity
                  style={styles.bannerBtn}
                  onPress={() => router.push('/(customer)/categories')}
                >
                  <Text style={styles.bannerBtnText}>SHOP NOW</Text>
                  <ArrowRight size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>CATEGORIES</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/categories')}>
            <Text style={[styles.seeAll, { color: colors.accent }]}>See All</Text>
          </TouchableOpacity>
        </View>
        {catLoading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {[1, 2, 3].map((i) => (
              <ShimmerLoader key={i} width={110} height={130} borderRadius={16} style={{ marginRight: 12 }} />
            ))}
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories?.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { borderColor: colors.border }]}
                onPress={() => router.push({ pathname: '/(customer)/categories', params: { categoryId: cat.id } })}
              >
                <CachedImage source={{ uri: cat.image_url || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300' }} style={styles.categoryImage} />
                <View style={styles.categoryOverlay} />
                <Text style={styles.categoryName}>{cat.name.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Featured Products */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>FEATURED</Text>
        </View>
        {featLoading ? (
          renderSkeletonList()
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listPadding}
          >
            {featured?.map((item) => (
              <React.Fragment key={item.id}>
                {renderProductItem({ item })}
              </React.Fragment>
            ))}
          </ScrollView>
        )}

        {/* New Arrivals */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>NEW ARRIVALS</Text>
        </View>
        {newLoading ? (
          renderSkeletonList()
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listPadding}
          >
            {newArrivals?.map((item) => (
              <React.Fragment key={item.id}>
                {renderProductItem({ item })}
              </React.Fragment>
            ))}
          </ScrollView>
        )}

        {/* Trending Now */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>TRENDING NOW</Text>
        </View>
        {trendLoading ? (
          renderSkeletonList()
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listPadding}
          >
            {trending?.map((item) => (
              <React.Fragment key={item.id}>
                {renderProductItem({ item })}
              </React.Fragment>
            ))}
          </ScrollView>
        )}

        {/* Empty spacing for bottom tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  searchButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchPlaceholder: {
    marginLeft: 10,
    fontSize: 14,
  },
  carouselContainer: {
    height: 380,
    marginBottom: 28,
  },
  bannerSlide: {
    width: width,
    height: 380,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  bannerSubtitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.85,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginRight: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    marginBottom: 24,
  },
  categoryCard: {
    width: 110,
    height: 130,
    borderRadius: 16,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  categoryName: {
    position: 'absolute',
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  listPadding: {
    paddingLeft: 20,
    paddingRight: 8,
    marginBottom: 24,
  },
  productCard: {
    width: 160,
    marginRight: 16,
  },
  imageContainer: {
    width: 160,
    height: 200,
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
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
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
});
