import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Heart, Share2, Send, ShieldCheck } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useProduct, useSimilarProducts } from '@/hooks/useProducts';
import { useFavoritesStore } from '@/store/favoritesStore';
import CachedImage from '@/components/CachedImage';
import Button from '@/components/Button';
import { Product } from '@/types';

const { width } = Dimensions.get('window');

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

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const { data: product, isLoading, error } = useProduct(id as string);
  const { data: similarProducts } = useSimilarProducts(product?.category_id || '', product?.id || '');

  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const isFav = isFavorite(product.id);
  const isFootwear = product.categories?.name.toLowerCase() === 'footwear';
  const sizesList = isFootwear ? FOOTWEAR_SIZES : CLOTHING_SIZES;
  const colorsList = DEFAULT_COLORS;

  const imagesList = product.product_images?.length 
    ? product.product_images.map(img => img.image_url)
    : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'];

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
        message: `Check out ${product.name} on StyleHub for $${product.price}!\n\nElevate your style.`,
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  const handleWhatsAppInquiry = () => {
    const whatsappNumber = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER || '1234567890';
    const selectedText = `${selectedSize ? `Size: ${selectedSize}` : ''} ${selectedColor ? `Color: ${selectedColor}` : ''}`.trim();
    
    const message = `Hi StyleHub! I am interested in purchasing the following product:\n\n*${product.name}*\nCategory: ${product.subcategory}\nPrice: $${product.discounted_price || product.price}\n${selectedText ? `Selection: ${selectedText}\n` : ''}\nIs this item currently available?`;
    
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open WhatsApp:', err);
      alert('Could not open WhatsApp. Please ensure it is installed on your device.');
    });
  };

  // Stock Badge calculation
  const getStockStatus = () => {
    const qty = product.stock_quantity;
    if (qty === 0) return { label: 'Out of Stock', color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.1)' };
    if (qty <= 3) return { label: `Low Stock (Only ${qty} left)`, color: '#FF9500', bg: 'rgba(255, 149, 0, 0.1)' };
    return { label: 'In Stock', color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)' };
  };

  const stockStatus = getStockStatus();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Overlay */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.backgroundSelected }]} onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.backgroundSelected }]} onPress={handleShare}>
            <Share2 size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.backgroundSelected }]} onPress={toggleWishlist}>
            <Heart size={18} color={isFav ? colors.accent : colors.text} fill={isFav ? colors.accent : 'transparent'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Images Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {imagesList.map((uri, index) => (
              <View key={index} style={styles.slide}>
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
                    { backgroundColor: activeImageIndex === index ? colors.accent : colors.border },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Details Card */}
        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brandLabel, { color: colors.textSecondary }]}>{product.subcategory.toUpperCase()}</Text>
              <Text style={[styles.productTitle, { color: colors.text }]}>{product.name}</Text>
            </View>
            <View style={styles.priceSection}>
              {product.discounted_price ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.price, { color: colors.accent }]}>${product.discounted_price}</Text>
                  <Text style={[styles.oldPrice, { color: colors.textSecondary }]}>${product.price}</Text>
                </View>
              ) : (
                <Text style={[styles.price, { color: colors.text }]}>${product.price}</Text>
              )}
            </View>
          </View>

          {/* Stock status badge */}
          <View style={[styles.stockBadge, { backgroundColor: stockStatus.bg }]}>
            <View style={[styles.stockDot, { backgroundColor: stockStatus.color }]} />
            <Text style={[styles.stockLabel, { color: stockStatus.color }]}>{stockStatus.label}</Text>
          </View>

          {/* Sizing Section */}
          <View style={styles.selectorSection}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>SELECT SIZE</Text>
            <View style={styles.sizeGrid}>
              {sizesList.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeChip,
                      {
                        backgroundColor: isSelected ? colors.text : colors.backgroundSelected,
                        borderColor: isSelected ? colors.text : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        { color: isSelected ? colors.background : colors.text },
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Color Section */}
          <View style={styles.selectorSection}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>SELECT COLOR</Text>
            <View style={styles.colorGrid}>
              {colorsList.map((color) => {
                const isSelected = selectedColor === color;
                const hexColor = COLOR_MAP[color] || '#FFF';
                const isWhite = color === 'White';

                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOutline,
                      { borderColor: isSelected ? colors.accent : 'transparent' },
                    ]}
                    onPress={() => setSelectedColor(color)}
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>THE DETAILS</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {product.description ||
                'No additional details provided. Experience maximum comfort and signature StyleHub engineering with this item.'}
            </Text>
          </View>

          {/* Security & Authenticity guarantees */}
          <View style={[styles.guaranteeRow, { borderColor: colors.border }]}>
            <ShieldCheck size={18} color={colors.accent} />
            <Text style={[styles.guaranteeText, { color: colors.textSecondary }]}>
              Authentic luxury item. Guaranteed secure inventory.
            </Text>
          </View>

          {/* Inquiry / Actions */}
          <Button
            title={product.stock_quantity === 0 ? 'OUT OF STOCK' : 'INQUIRE ON WHATSAPP'}
            onPress={handleWhatsAppInquiry}
            variant={product.stock_quantity === 0 ? 'secondary' : 'accent'}
            disabled={product.stock_quantity === 0}
            style={styles.inquireBtn}
          />

          {/* Similar Products */}
          {similarProducts && similarProducts.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 16 }]}>
                YOU MAY ALSO LIKE
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarScroll}>
                {similarProducts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.similarCard}
                    onPress={() => {
                      router.replace({ pathname: '/(customer)/product/[id]', params: { id: item.id } });
                    }}
                  >
                    <CachedImage source={{ uri: item.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300' }} style={styles.similarImage} />
                    <Text style={[styles.similarName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.similarPrice, { color: colors.textSecondary }]}>
                      ${item.price}
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
    fontWeight: '500',
  },
  topHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  carouselContainer: {
    height: 480,
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  slide: {
    width: width,
    height: 480,
  },
  imageSlide: {
    width: '100%',
    height: '100%',
  },
  indicators: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detailsContainer: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  brandLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
  },
  oldPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 24,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectorSection: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOutline: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  descSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 16,
    marginBottom: 28,
  },
  guaranteeText: {
    fontSize: 12,
    marginLeft: 8,
  },
  inquireBtn: {
    height: 56,
    borderRadius: 12,
    marginBottom: 36,
  },
  similarSection: {
    marginTop: 12,
  },
  similarScroll: {
    gap: 16,
  },
  similarCard: {
    width: 120,
  },
  similarImage: {
    width: 120,
    height: 150,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F5F5F5',
  },
  similarName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  similarPrice: {
    fontSize: 11,
  },
});
