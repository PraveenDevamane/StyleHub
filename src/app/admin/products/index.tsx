import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Plus, Edit2, Trash2 } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useProducts } from '@/hooks/useProducts';
import { db } from '@/services/firebase';
import { useQueryClient } from '@tanstack/react-query';
import CachedImage from '@/components/CachedImage';
import { Product } from '@/types';

export default function AdminProductsListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const [searchVal, setSearchVal] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchVal.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchVal]);

  const { data: products, isLoading, refetch, isRefetching } = useProducts({
    searchQuery: debouncedSearch || undefined,
  });

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This will also remove all stock and image records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { doc, deleteDoc } = await import('firebase/firestore');
              const docRef = doc(db, 'products', product.id);
              await deleteDoc(docRef);

              queryClient.invalidateQueries({ queryKey: ['products'] });
              Alert.alert('Success', 'Product deleted successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'An unexpected error occurred.');
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const mainImage = item.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300';
    const isOutOfStock = item.stock_quantity === 0;
    const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= 3;

    let stockText = 'In Stock';
    let stockColor = '#34C759';
    if (isOutOfStock) {
      stockText = 'Out of Stock';
      stockColor = '#FF3B30';
    } else if (isLowStock) {
      stockText = `Low Stock (${item.stock_quantity})`;
      stockColor = '#FF9500';
    }

    return (
      <View style={[styles.productRow, { borderBottomColor: colors.border }]}>
        <CachedImage source={{ uri: mainImage }} style={styles.productImage} />
        <View style={styles.infoCol}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.productMeta, { color: colors.textSecondary }]}>
            {item.product_code ? `${item.product_code} • ` : ''}{item.categories?.name} • {item.subcategory}
          </Text>
          <View style={styles.pricingRow}>
            <Text style={[styles.price, { color: colors.text }]}>${item.price}</Text>
            <View style={[styles.stockIndicator, { backgroundColor: stockColor + '15' }]}>
              <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
              <Text style={[styles.stockText, { color: stockColor }]}>{stockText}</Text>
            </View>
          </View>
        </View>
        <View style={styles.actionsCol}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.backgroundSelected }]}
            onPress={() => router.push({ pathname: '/admin/products/editor', params: { id: item.id } })}
          >
            <Edit2 size={14} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={14} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.backgroundSelected }]}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>MANAGE PRODUCTS</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/admin/products/editor')}
        >
          <Plus size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={[styles.searchSection, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchWrapper, { backgroundColor: colors.backgroundSelected }]}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search catalog..."
            placeholderTextColor={colors.textSecondary}
            value={searchVal}
            onChangeText={setSearchVal}
          />
        </View>
      </View>

      {/* Product List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : products && products.length > 0 ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContainer}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No products found in the catalog.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  productImage: {
    width: 54,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  infoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  productMeta: {
    fontSize: 11,
    marginBottom: 6,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  stockText: {
    fontSize: 9,
    fontWeight: '700',
  },
  actionsCol: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
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
  },
  emptyText: {
    fontSize: 14,
  },
});
