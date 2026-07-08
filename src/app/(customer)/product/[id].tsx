import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Heart, Share2, ShieldCheck } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useProduct, useSimilarProducts } from '@/hooks/useProducts';
import { useFavoritesStore } from '@/store/favoritesStore';
import CachedImage from '@/components/CachedImage';
import Button from '@/components/Button';

const MAX_CONTENT_WIDTH = 1480;
const SIDE_PADDING = 28;

const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const FOOTWEAR_SIZES = ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'];

const COLOR_MAP: Record<string, string> = {
  Black: '#111111',
  White: '#FFFFFF',
  Gray: '#8E8E93',
  Sand: '#D2B48C',
  Navy: '#1D2A44',
  Orange: '#FF6B00',
};

const DEFAULT_COLORS = ['Black', 'White', 'Gray', 'Sand'];
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900';

function formatPrice(value: number) {
  return `$${value}`;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const { data: product, isLoading, error } = useProduct(id as string);
  const { data: similarProducts } = useSimilarProducts(product?.category_id || '', product?.id || '');

  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const shellWidth = Math.max(320, Math.min(width, MAX_CONTENT_WIDTH));
  const availableWidth = shellWidth - SIDE_PADDING * 2;
  const isWide = width >= 900;
  const galleryWidth = isWide ? Math.round((availableWidth - 24) * 0.54) : availableWidth;
  const galleryHeight = isWide ? Math.min(620, Math.round(galleryWidth * 1.18)) : Math.min(520, Math.round(galleryWidth * 1.22));

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Product not found.</Text>
        <Button title="Go back" onPress={() => router.back()} style={styles.errorButton} />
      </View>
    );
  }

  const isFav = isFavorite(product.id);
  const isFootwear = product.categories?.name.toLowerCase() === 'footwear';
  const sizesList = isFootwear ? FOOTWEAR_SIZES : CLOTHING_SIZES;
  const imagesList = product.product_images?.length
    ? product.product_images.map((img) => img.image_url)
    : [FALLBACK_PRODUCT_IMAGE];

  const toggleWishlist = () => {
    if (isFav) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product.name} on StyleHub for ${formatPrice(product.discounted_price || product.price)}.`,
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  const handleWhatsAppInquiry = () => {
    const whatsappNumber = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER || '1234567890';
    const selectedText = `${selectedSize ? `Size: ${selectedSize}` : ''} ${selectedColor ? `Color: ${selectedColor}` : ''}`.trim();

    const message = `Hi StyleHub! I am interested in purchasing the following product:\n\n*${product.name}*\nCategory: ${product.subcategory}\nPrice: ${formatPrice(product.discounted_price || product.price)}\n${selectedText ? `Selection: ${selectedText}\n` : ''}\nIs this item currently available?`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open WhatsApp:', err);
      alert('Could not open WhatsApp. Please ensure it is installed on your device.');
    });
  };

  const getStockStatus = () => {
    const qty = product.stock_quantity;
    if (qty === 0) return { label: 'Out of stock', color: '#D64545', bg: 'rgba(214, 69, 69, 0.12)' };
    if (qty <= 3) return { label: `Only ${qty} left`, color: colors.warning, bg: theme === 'dark' ? 'rgba(227, 176, 95, 0.16)' : 'rgba(183, 121, 31, 0.12)' };
    return { label: 'In stock', color: colors.success, bg: theme === 'dark' ? 'rgba(122, 211, 148, 0.14)' : 'rgba(47, 139, 87, 0.12)' };
  };

  const stockStatus = getStockStatus();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentShell}>
          <View style={styles.topBar}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={[styles.headerBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
              onPress={() => router.back()}
            >
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Share product"
                style={[styles.headerBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                onPress={handleShare}
              >
                <Share2 size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={isFav ? 'Remove from saved items' : 'Save item'}
                style={[styles.headerBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                onPress={toggleWishlist}
              >
                <Heart size={18} color={isFav ? colors.highlight : colors.text} fill={isFav ? colors.highlight : 'transparent'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.productLayout, isWide && styles.productLayoutWide]}>
            <View style={[styles.galleryCard, { width: galleryWidth, backgroundColor: colors.backgroundSelected }]}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / galleryWidth);
                  setActiveImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {imagesList.map((uri, index) => (
                  <View key={uri || index} style={{ width: galleryWidth, height: galleryHeight }}>
                    <CachedImage source={{ uri }} style={styles.imageSlide} />
                  </View>
                ))}
              </ScrollView>
              {imagesList.length > 1 && (
                <View style={styles.indicators}>
                  {imagesList.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicatorDot,
                        { backgroundColor: activeImageIndex === index ? colors.accent : 'rgba(255, 255, 255, 0.72)' },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.detailsPanel, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
              <Text style={[styles.brandLabel, { color: colors.textSecondary }]}>{product.subcategory}</Text>
              <Text style={[styles.productTitle, { color: colors.text }]}>{product.name}</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 4, marginBottom: 8 }}>
                {product.product_code ? (
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                    Code: {product.product_code}
                  </Text>
                ) : null}
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  ID: <Text style={{ fontWeight: '700', color: colors.textSecondary, userSelect: 'text' } as any}>{product.id}</Text>
                </Text>
              </View>

              <View style={styles.priceRow}>
                {product.discounted_price ? (
                  <>
                    <Text style={[styles.price, { color: colors.highlight }]}>{formatPrice(product.discounted_price)}</Text>
                    <Text style={[styles.oldPrice, { color: colors.textSecondary }]}>{formatPrice(product.price)}</Text>
                  </>
                ) : (
                  <Text style={[styles.price, { color: colors.text }]}>{formatPrice(product.price)}</Text>
                )}
              </View>

              <View style={[styles.stockBadge, { backgroundColor: stockStatus.bg }]}>
                <View style={[styles.stockDot, { backgroundColor: stockStatus.color }]} />
                <Text style={[styles.stockLabel, { color: stockStatus.color }]}>{stockStatus.label}</Text>
              </View>

              <View style={styles.selectorSection}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Size</Text>
                <View style={styles.sizeGrid}>
                  {sizesList.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.sizeChip,
                          {
                            backgroundColor: isSelected ? colors.text : colors.background,
                            borderColor: isSelected ? colors.text : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedSize(size)}
                        activeOpacity={0.86}
                      >
                        <Text style={[styles.sizeText, { color: isSelected ? colors.background : colors.text }]}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.selectorSection}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Color</Text>
                <View style={styles.colorGrid}>
                  {DEFAULT_COLORS.map((color) => {
                    const isSelected = selectedColor === color;
                    const hexColor = COLOR_MAP[color] || '#FFFFFF';
                    const isWhite = color === 'White';

                    return (
                      <TouchableOpacity
                        key={color}
                        accessibilityLabel={`Select ${color}`}
                        style={[
                          styles.colorOption,
                          { borderColor: isSelected ? colors.accent : colors.border, backgroundColor: colors.background },
                        ]}
                        onPress={() => setSelectedColor(color)}
                        activeOpacity={0.86}
                      >
                        <View
                          style={[
                            styles.colorChip,
                            {
                              backgroundColor: hexColor,
                              borderWidth: isWhite ? 1 : 0,
                              borderColor: colors.border,
                            },
                          ]}
                        />
                        <Text style={[styles.colorText, { color: colors.text }]}>{color}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.descSection}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Details</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {product.description ||
                    'No additional details provided. This piece is selected for everyday comfort and an easy fit in a modern wardrobe.'}
                </Text>
              </View>

              <View style={[styles.guaranteeRow, { borderColor: colors.border }]}>
                <ShieldCheck size={18} color={colors.accent} />
                <Text style={[styles.guaranteeText, { color: colors.textSecondary }]}>
                  Authentic item with secure inventory confirmation.
                </Text>
              </View>

              <Button
                title={product.stock_quantity === 0 ? 'Out of stock' : 'Inquire on WhatsApp'}
                onPress={handleWhatsAppInquiry}
                variant={product.stock_quantity === 0 ? 'secondary' : 'accent'}
                disabled={product.stock_quantity === 0}
                style={styles.inquireBtn}
              />
            </View>
          </View>

          {similarProducts && similarProducts.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 14 }]}>You may also like</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarScroll}>
                {similarProducts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.similarCard, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                    onPress={() => {
                      router.replace({ pathname: '/(customer)/product/[id]', params: { id: item.id } });
                    }}
                    activeOpacity={0.88}
                  >
                    <CachedImage
                      source={{ uri: item.product_images?.[0]?.image_url || FALLBACK_PRODUCT_IMAGE }}
                      style={[styles.similarImage, { backgroundColor: colors.backgroundSelected }]}
                    />
                    <Text style={[styles.similarName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.similarPrice, { color: colors.textSecondary }]}>
                      {formatPrice(item.discounted_price || item.price)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorButton: {
    marginTop: 18,
  },
  scrollContainer: {
    paddingBottom: 112,
  },
  contentShell: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: SIDE_PADDING,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  productLayout: {
    gap: 18,
  },
  productLayoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  galleryCard: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imageSlide: {
    width: '100%',
    height: '100%',
  },
  indicators: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  detailsPanel: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
  },
  brandLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  productTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 9,
    marginTop: 12,
    marginBottom: 12,
  },
  price: {
    fontSize: 25,
    fontWeight: '900',
  },
  oldPrice: {
    fontSize: 15,
    textDecorationLine: 'line-through',
  },
  stockBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 24,
  },
  stockDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  selectorSection: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 10,
  },
  sizeChip: {
    minWidth: 54,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 10,
  },
  colorOption: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  colorChip: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  colorText: {
    fontSize: 12,
    fontWeight: '800',
  },
  descSection: {
    marginBottom: 22,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 15,
    marginBottom: 20,
  },
  guaranteeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  inquireBtn: {
    height: 54,
    borderRadius: 8,
  },
  similarSection: {
    marginTop: 28,
  },
  similarScroll: {
    gap: 14,
    paddingRight: 2,
  },
  similarCard: {
    width: 150,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  similarImage: {
    width: '100%',
    height: 174,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  similarPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
});
