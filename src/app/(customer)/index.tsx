import React, { useState } from 'react';
import {
  Animated as RNAnimated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Heart, Search, ShoppingBag, Tag } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors, Fonts } from '@/constants/theme';
import {
  useCategories,
  useFeaturedProducts,
  useNewArrivals,
  useTrendingProducts,
} from '@/hooks/useProducts';
import { useFavoritesStore } from '@/store/favoritesStore';
import CachedImage from '@/components/CachedImage';
import ShimmerLoader from '@/components/ShimmerLoader';
import { Category, Product } from '@/types';

const MAX_CONTENT_WIDTH = 1480;
const SIDE_PADDING = 28;
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500';

const HERO_BANNERS = [
  {
    id: '1',
    eyebrow: "Autumn Winter '26",
    titleStart: 'The',
    titleAccent: 'New',
    titleEnd: 'Standard',
    subtitle: 'Explore curated essentials designed for the modern silhouette.',
    cta: 'Shop collection',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600',
  },
  {
    id: '2',
    eyebrow: 'Fresh drops',
    titleStart: 'Move',
    titleAccent: 'With',
    titleEnd: 'Color',
    subtitle: 'Sneakers, sandals, and formal picks with bright everyday energy.',
    cta: 'Browse footwear',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600',
  },
  {
    id: '3',
    eyebrow: 'Occasion edit',
    titleStart: 'Where',
    titleAccent: 'Tradition',
    titleEnd: 'Shines',
    subtitle: 'Premium textures, festive color, and joyful product discovery.',
    cta: 'Explore styles',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600',
  },
];

const CATEGORY_FALLBACKS: Record<string, string> = {
  accessories: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500', // Sunglasses/Watch
  bags: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', // Bag
  dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', // Dress
  footwear: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500', // Sneaker
  jackets: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', // Jacket
  jeans: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500', // Jeans
  shirts: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', // Shirt
  kurta: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500', // Kurta
  lehenga: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500', // Lehenga
  saree: 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=500', // Saree
};

function formatPrice(value: number) {
  return `$${value}`;
}

type ThemeColors = (typeof Colors)[keyof typeof Colors];

interface AnimatedProductCardProps {
  item: Product;
  index: number;
  itemWidth: number;
  scrollX: RNAnimated.Value;
  colors: ThemeColors;
  isFav: boolean;
  onPress: () => void;
  onToggleWishlist: () => void;
}

function AnimatedProductCard({
  item,
  index,
  itemWidth,
  scrollX,
  colors,
  isFav,
  onPress,
  onToggleWishlist,
}: AnimatedProductCardProps) {
  const mainImage = item.product_images?.[0]?.image_url || FALLBACK_PRODUCT_IMAGE;
  const hasSale = Boolean(item.discounted_price);
  const cardStride = itemWidth + 18;
  const inputRange = [(index - 1) * cardStride, index * cardStride, (index + 1) * cardStride];
  const animatedCardStyle = {
    opacity: scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        scale: scrollX.interpolate({
          inputRange,
          outputRange: [0.98, 1, 0.98],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  return (
    <RNAnimated.View style={[styles.animatedRailItem, animatedCardStyle]}>
      <TouchableOpacity
        style={[
          styles.productCard,
          styles.softShadow,
          {
            width: itemWidth,
            backgroundColor: colors.backgroundElement,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <View
          style={[
            styles.imageContainer,
            { height: Math.round(itemWidth * 1.2), backgroundColor: colors.backgroundSelected },
          ]}
        >
          <CachedImage source={{ uri: mainImage }} style={styles.productImage} />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Remove from saved items' : 'Save item'}
            style={[styles.favButton, { backgroundColor: colors.backgroundElement }]}
            onPress={onToggleWishlist}
          >
            <Heart size={16} color={isFav ? colors.highlight : colors.text} fill={isFav ? colors.highlight : 'transparent'} />
          </TouchableOpacity>
          {hasSale && (
            <View style={[styles.saleTag, { backgroundColor: colors.highlight }]}>
              <Tag size={11} color="#FFFFFF" />
              <Text style={styles.saleTagText}>Deal</Text>
            </View>
          )}
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
    </RNAnimated.View>
  );
}

interface ProductRailProps {
  products: Product[];
  itemWidth: number;
  colors: ThemeColors;
  isFavorite: (id: string) => boolean;
  onOpenProduct: (id: string) => void;
  onToggleWishlist: (product: Product) => void;
}

function ProductRail({
  products,
  itemWidth,
  colors,
  isFavorite,
  onOpenProduct,
  onToggleWishlist,
}: ProductRailProps) {
  const [scrollX] = React.useState(() => new RNAnimated.Value(0));
  const handleScroll = RNAnimated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  return (
    <RNAnimated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      contentContainerStyle={styles.productRail}
      decelerationRate="fast"
      snapToInterval={itemWidth + 18}
    >
      {products.map((item, index) => (
        <AnimatedProductCard
          key={item.id}
          item={item}
          index={index}
          itemWidth={itemWidth}
          scrollX={scrollX}
          colors={colors}
          isFav={isFavorite(item.id)}
          onPress={() => onOpenProduct(item.id)}
          onToggleWishlist={() => onToggleWishlist(item)}
        />
      ))}
    </RNAnimated.ScrollView>
  );
}

interface AnimatedCategoryCardProps {
  category: Category;
  index: number;
  itemWidth: number;
  scrollX: RNAnimated.Value;
  colors: ThemeColors;
  onPress: () => void;
}

function AnimatedCategoryCard({ category, index, itemWidth, scrollX, colors, onPress }: AnimatedCategoryCardProps) {
  const cardStride = itemWidth + 16;
  const inputRange = [(index - 1) * cardStride, index * cardStride, (index + 1) * cardStride];
  const animatedCardStyle = {
    opacity: scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        scale: scrollX.interpolate({
          inputRange,
          outputRange: [0.98, 1, 0.98],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const nameKey = category.name.toLowerCase();
  const fallbackUrl = CATEGORY_FALLBACKS[nameKey] || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500';

  return (
    <RNAnimated.View style={animatedCardStyle}>
      <TouchableOpacity
        style={[styles.categoryItem, { width: itemWidth }]}
        onPress={onPress}
        activeOpacity={0.86}
      >
        <View style={[styles.categoryTile, { backgroundColor: colors.backgroundSelected, borderColor: colors.cardBorder }]}>
          <CachedImage
            source={{ uri: category.image_url || fallbackUrl }}
            style={styles.categoryImage}
          />
          <View style={styles.categoryOverlay} />
          <Text style={styles.categoryName} numberOfLines={1}>
            {category.name}
          </Text>
        </View>
      </TouchableOpacity>
    </RNAnimated.View>
  );
}

interface CategoryRailProps {
  categories: Category[];
  itemWidth: number;
  colors: ThemeColors;
  onOpenCategory: (id: string) => void;
}

function CategoryRail({ categories, itemWidth, colors, onOpenCategory }: CategoryRailProps) {
  const [scrollX] = React.useState(() => new RNAnimated.Value(0));
  const handleScroll = RNAnimated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  return (
    <RNAnimated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      contentContainerStyle={styles.categoryRail}
      decelerationRate="fast"
      snapToInterval={itemWidth + 16}
    >
      {categories.map((category, index) => (
        <AnimatedCategoryCard
          key={category.id}
          category={category}
          index={index}
          itemWidth={itemWidth}
          scrollX={scrollX}
          colors={colors}
          onPress={() => onOpenCategory(category.id)}
        />
      ))}
    </RNAnimated.ScrollView>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const { data: categories, isLoading: catLoading, refetch: refetchCats } = useCategories();
  const { data: featured, isLoading: featLoading, refetch: refetchFeat } = useFeaturedProducts();
  const { data: newArrivals, isLoading: newLoading, refetch: refetchNew } = useNewArrivals();
  const { data: trending, isLoading: trendLoading, refetch: refetchTrend } = useTrendingProducts();

  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const [refreshing, setRefreshing] = useState(false);

  const contentWidth = Math.max(320, Math.min(width, MAX_CONTENT_WIDTH) - SIDE_PADDING * 2);
  const isWide = width >= 820;
  const heroHeight = isWide ? 360 : 330;
  const productCardWidth = isWide ? 220 : 164;
  const categoryCardWidth = isWide ? 190 : 150;

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

  const renderSkeletonList = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRail}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.productCard, { width: productCardWidth }]}>
          <ShimmerLoader height={Math.round(productCardWidth * 1.18)} borderRadius={8} style={styles.skeletonImage} />
          <ShimmerLoader width="72%" height={14} style={styles.skeletonLine} />
          <ShimmerLoader width="46%" height={12} style={styles.skeletonLine} />
          <ShimmerLoader width="34%" height={14} />
        </View>
      ))}
    </ScrollView>
  );

  const renderProductSection = (
    title: string,
    subtitle: string,
    products: Product[] | undefined,
    loading: boolean
  ) => {
    const sectionBg = theme === 'dark'
      ? colors.backgroundElement
      : title === 'Featured edits'
        ? '#FFF0DB'
        : title === 'New arrivals'
          ? '#FFE6C7'
          : '#FFF8EF';

    return (
      <View style={[styles.section, { backgroundColor: sectionBg, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleBlock}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`View all ${title}`}
            onPress={() => router.push('/(customer)/categories')}
            style={[styles.iconLink, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
          >
            <ArrowRight size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
        {loading ? (
        renderSkeletonList()
      ) : products && products.length > 0 ? (
        <ProductRail
          products={products}
          itemWidth={productCardWidth}
          colors={colors}
          isFavorite={isFavorite}
          onOpenProduct={(productId) => router.push(`/(customer)/product/${productId}`)}
          onToggleWishlist={toggleWishlist}
        />
      ) : (
          <View style={[styles.emptyStrip, { backgroundColor: colors.backgroundSelected, borderColor: colors.cardBorder }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products to show yet.</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.contentShell}>
          <View style={[styles.header, isWide && styles.headerWide]}>
            <View>
              <Text style={[styles.brandText, { color: colors.text }]}>StyleHub</Text>
              <Text style={[styles.brandSubtext, { color: colors.textSecondary }]}>Curated fashion catalog</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="search"
              style={[
                styles.searchButton,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.cardBorder,
                  width: isWide ? 360 : '100%',
                },
              ]}
              onPress={() => router.push('/(customer)/search')}
              activeOpacity={0.88}
            >
              <Search size={18} color={colors.textSecondary} />
              <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>Search products, codes, styles</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={[styles.heroCarousel, { height: heroHeight }]}
          >
            {HERO_BANNERS.map((banner) => (
              <View key={banner.id} style={[styles.bannerSlide, { width: contentWidth, height: heroHeight }]}>
                <CachedImage source={{ uri: banner.image }} style={styles.bannerImage} />
                <View style={styles.bannerOverlay} />
                <View style={styles.bannerContent}>
                  <View style={styles.heroPill}>
                    <ShoppingBag size={13} color="#FFFFFF" />
                    <Text style={styles.heroPillText}>{banner.eyebrow}</Text>
                  </View>
                  <Text style={[styles.bannerTitle, { fontSize: isWide ? 76 : 48, lineHeight: isWide ? 80 : 52 }]}>
                    {banner.titleStart}{' '}
                    <Text style={styles.bannerTitleAccent}>{banner.titleAccent}</Text>
                    {'\n'}
                    {banner.titleEnd}
                  </Text>
                  <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  <TouchableOpacity
                    style={styles.bannerBtn}
                    onPress={() => router.push('/(customer)/categories')}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.bannerBtnText}>{banner.cta}</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>



          <View style={[styles.section, { backgroundColor: theme === 'dark' ? colors.backgroundElement : '#FFF3E3', borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleBlock}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Shop by category</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Start with the shape of what you need.</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View all categories"
                onPress={() => router.push('/(customer)/categories')}
                style={[styles.iconLink, { backgroundColor: colors.tint, borderColor: colors.cardBorder }]}
              >
                <ArrowRight size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
            {catLoading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={[styles.categoryItem, { width: categoryCardWidth }]}>
                    <ShimmerLoader width={categoryCardWidth} height={Math.round(categoryCardWidth * 1.18)} borderRadius={8} style={styles.categorySkeleton} />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <CategoryRail
                categories={categories ?? []}
                itemWidth={categoryCardWidth}
                colors={colors}
                onOpenCategory={(categoryId) => router.push({ pathname: '/(customer)/categories', params: { categoryId } })}
              />
            )}
          </View>

          {renderProductSection('Featured edits', 'Best pieces to open the catalog.', featured, featLoading)}
          {renderProductSection('New arrivals', 'Recently added products, ready to browse.', newArrivals, newLoading)}
          {renderProductSection('Trending now', 'Popular picks moving fast.', trending, trendLoading)}
        </View>

        <View style={styles.bottomSpacer} />
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
  contentShell: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: SIDE_PADDING,
  },
  header: {
    gap: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  headerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
  },
  brandSubtext: {
    fontSize: 13,
    marginTop: 3,
  },
  searchButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
  heroCarousel: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bannerSlide: {
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(36, 22, 15, 0.46)',
  },
  bannerContent: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 24,
    maxWidth: 520,
  },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 107, 0, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  heroPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontFamily: Fonts.serif,
    fontWeight: '700',
    maxWidth: 560,
  },
  bannerTitleAccent: {
    color: 'rgba(255, 248, 239, 0.72)',
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 460,
  },
  bannerBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#F97316',
  },
  bannerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  section: {
    marginTop: 14,
    marginBottom: 22,
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  sectionTitleBlock: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  iconLink: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryRail: {
    gap: 16,
    paddingRight: 8,
    paddingTop: 10,
    paddingBottom: 18,
  },
  categoryItem: {
    alignItems: 'stretch',
  },
  categoryTile: {
    width: '100%',
    aspectRatio: 0.84,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(36, 22, 15, 0.28)',
  },
  categorySkeleton: {
    marginBottom: 8,
  },
  categoryName: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  productRail: {
    gap: 18,
    paddingRight: 8,
    paddingTop: 14,
    paddingBottom: 24,
  },
  animatedRailItem: {
    paddingTop: 18,
  },
  productCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  softShadow: Platform.select({
    web: {
      shadowColor: '#17201B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    default: {
      shadowColor: '#17201B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 2,
    },
  }),
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
  saleTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  saleTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
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
  skeletonImage: {
    marginBottom: 10,
  },
  skeletonLine: {
    marginBottom: 7,
  },
  emptyStrip: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  emptyText: {
    fontSize: 14,
  },
  bottomSpacer: {
    height: 132,
  },
});
