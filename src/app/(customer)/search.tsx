import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, X, Clock, Heart, Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useProducts } from '@/hooks/useProducts';
import { useFavoritesStore } from '@/store/favoritesStore';
import CachedImage from '@/components/CachedImage';
import VisualSearchModal from '@/components/VisualSearchModal';
import { Product } from '@/types';

const RECENT_SEARCHES_KEY = 'stylehub-recent-searches';
const POPULAR_TAGS = ['Sneakers', 'Hoodies', 'Jeans', 'T-Shirts', 'Jackets'];

export default function SearchScreen() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const [inputVal, setInputVal] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isVisualSearchVisible, setIsVisualSearchVisible] = useState(false);

  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  // Debounce the text input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputVal.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [inputVal]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
  };

  // Load recent searches from AsyncStorage
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const saveRecentSearch = async (query: string) => {
    if (!query) return;
    try {
      const filtered = recentSearches.filter((item) => item.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 5); // Keep top 5
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

  // Fetch products matching the query
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

  const renderProductItem = ({ item }: { item: Product }) => {
    const isFav = isFavorite(item.id);
    const mainImage = item.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400';

    return (
      <TouchableOpacity
        style={[styles.resultCard, { borderBottomColor: colors.border }]}
        onPress={() => router.push(`/(customer)/product/${item.id}`)}
      >
        <CachedImage source={{ uri: mainImage }} style={styles.productImage} />
        <View style={styles.infoContainer}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.productSub, { color: colors.textSecondary }]}>
            {item.subcategory}
          </Text>
          <Text style={[styles.price, { color: colors.accent }]}>${item.price}</Text>
        </View>
        <TouchableOpacity
          style={[styles.favBtn, { backgroundColor: colors.backgroundSelected }]}
          onPress={() => toggleWishlist(item)}
        >
          <Heart size={14} color={isFav ? colors.accent : colors.text} fill={isFav ? colors.accent : 'transparent'} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input Bar */}
      <View style={[styles.searchBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSelected }]}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
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
          {inputVal.length > 0 ? (
            <TouchableOpacity onPress={() => setInputVal('')} style={styles.clearBtn}>
              <X size={14} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsVisualSearchVisible(true)} style={styles.clearBtn}>
              <Camera size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      {debouncedQuery.length === 0 ? (
        <ScrollView style={styles.suggestionsContainer}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>RECENT SEARCHES</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={[styles.clearLink, { color: colors.accent }]}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((search, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.recentItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setInputVal(search);
                    setDebouncedQuery(search);
                  }}
                >
                  <Clock size={14} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={[styles.recentText, { color: colors.text }]}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popular Tag suggestions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 14 }]}>POPULAR SEARCHES</Text>
            <View style={styles.tagsContainer}>
              {POPULAR_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, { backgroundColor: colors.backgroundSelected }]}
                  onPress={() => {
                    setInputVal(tag);
                    setDebouncedQuery(tag);
                    saveRecentSearch(tag);
                  }}
                >
                  <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : products && products.length > 0 ? (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listPadding}
              renderItem={renderProductItem}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No products found matching &quot;{debouncedQuery}&quot;
              </Text>
            </View>
          )}
        </View>
      )}

      <VisualSearchModal
        visible={isVisualSearchVisible}
        onClose={() => setIsVisualSearchVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  clearLink: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  recentText: {
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  productImage: {
    width: 60,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
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
  favBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
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
