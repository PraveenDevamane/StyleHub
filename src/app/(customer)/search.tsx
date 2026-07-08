import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, Heart, Search, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useProducts } from '@/hooks/useProducts';
import { useFavoritesStore } from '@/store/favoritesStore';
import CachedImage from '@/components/CachedImage';
import { Product } from '@/types';

const RECENT_SEARCHES_KEY = 'stylehub-recent-searches';
const POPULAR_TAGS = ['Sneakers', 'Hoodies', 'Jeans', 'T-Shirts', 'Jackets'];
const MAX_CONTENT_WIDTH = 900;
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400';

function formatPrice(value: number) {
  return `$${value}`;
}

export default function SearchScreen() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const [inputVal, setInputVal] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);


  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputVal.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [inputVal]);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((stored) => {
        if (stored && isMounted) {
          setRecentSearches(JSON.parse(stored));
        }
      })
      .catch((e) => {
        console.error('Failed to load recent searches:', e);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveRecentSearch = async (query: string) => {
    if (!query) return;
    try {
      const filtered = recentSearches.filter((item) => item.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search:', e);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Failed to clear searches:', e);
    }
  };

  const { data: products, isLoading } = useProducts({
    searchQuery: debouncedQuery || undefined,
  });

  const handleSearchSubmit = () => {
    const query = inputVal.trim();
    if (query) {
      saveRecentSearch(query);
      setDebouncedQuery(query);
    }
  };

  const toggleWishlist = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
    }
  };

  const applySearch = (query: string) => {
    setInputVal(query);
    setDebouncedQuery(query);
    saveRecentSearch(query);
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const isFav = isFavorite(item.id);
    const mainImage = item.product_images?.[0]?.image_url || FALLBACK_PRODUCT_IMAGE;

    return (
      <TouchableOpacity
        style={[styles.resultCard, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
        onPress={() => router.push(`/(customer)/product/${item.id}`)}
        activeOpacity={0.88}
      >
        <CachedImage source={{ uri: mainImage }} style={[styles.productImage, { backgroundColor: colors.backgroundSelected }]} />
        <View style={styles.infoContainer}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.productSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.subcategory}
          </Text>
          <Text style={[styles.price, { color: item.discounted_price ? colors.highlight : colors.text }]}>
            {formatPrice(item.discounted_price || item.price)}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isFav ? 'Remove from saved items' : 'Save item'}
          style={[styles.favBtn, { backgroundColor: colors.tint }]}
          onPress={() => toggleWishlist(item)}
        >
          <Heart size={15} color={isFav ? colors.highlight : colors.text} fill={isFav ? colors.highlight : 'transparent'} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentShell}>
        <View style={styles.searchHeader}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={[styles.backButton, { borderColor: colors.cardBorder, backgroundColor: colors.backgroundElement }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Search catalog..."
              placeholderTextColor={colors.textSecondary}
              value={inputVal}
              onChangeText={setInputVal}
              onSubmitEditing={handleSearchSubmit}
              autoFocus
              returnKeyType="search"
            />
            {inputVal.length > 0 && (
              <TouchableOpacity onPress={() => setInputVal('')} style={styles.iconButton}>
                <X size={16} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {debouncedQuery.length === 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
          <View style={styles.contentShell}>
            <View style={[styles.searchIntro, { backgroundColor: colors.tint, borderColor: colors.cardBorder }]}>
              <Text style={[styles.searchIntroTitle, { color: colors.text }]}>Find a product quickly</Text>
              <Text style={[styles.searchIntroText, { color: colors.textSecondary }]}>
                Search by product name, product code, or a style you have in mind.
              </Text>
            </View>

            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent searches</Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={[styles.clearLink, { color: colors.accent }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.listBlock, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
                  {recentSearches.map((search, idx) => (
                    <TouchableOpacity
                      key={search}
                      style={[styles.recentItem, idx > 0 && { borderTopColor: colors.border, borderTopWidth: 1 }]}
                      onPress={() => applySearch(search)}
                    >
                      <Clock size={15} color={colors.textSecondary} />
                      <Text style={[styles.recentText, { color: colors.text }]}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Popular searches</Text>
              <View style={styles.tagsContainer}>
                {POPULAR_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}
                    onPress={() => applySearch(tag)}
                    activeOpacity={0.86}
                  >
                    <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.resultsWrap}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : products && products.length > 0 ? (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.listPadding, { maxWidth: MAX_CONTENT_WIDTH }]}
              renderItem={renderProductItem}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                  Results for {debouncedQuery}: {products.length}
                </Text>
              }
            />
          ) : (
            <View style={styles.center}>
              <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.cardBorder }]}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No matching products</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Try a shorter term or browse categories instead.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
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
    paddingHorizontal: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 13,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  iconButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsScroll: {
    paddingBottom: 104,
  },
  searchIntro: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    marginBottom: 24,
  },
  searchIntroTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  searchIntroText: {
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  clearLink: {
    fontSize: 13,
    fontWeight: '800',
  },
  listBlock: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  recentItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  recentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultsWrap: {
    flex: 1,
  },
  listPadding: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 104,
    gap: 10,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  productImage: {
    width: 68,
    height: 84,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 13,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  productSub: {
    fontSize: 12,
    marginBottom: 7,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
  },
  favBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
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
});
