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
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Plus, Minus, Info, Layers, RefreshCw } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useCategories, useProducts } from '@/hooks/useProducts';
import { db } from '@/services/firebase';
import { collection, doc, updateDoc, addDoc } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import CachedImage from '@/components/CachedImage';
import { Product } from '@/types';

const { width } = Dimensions.get('window');

interface LocationArea {
  code: string;
  name: string;
  description: string;
  zones: {
    code: string;
    name: string;
    shelves: { code: string; label: string }[];
  }[];
}

const LOCATION_PLAN: LocationArea[] = [
  {
    code: 'LS',
    name: 'Left Storage Room',
    description: 'garment back-stock room',
    zones: [
      {
        code: 'L',
        name: 'Left Storage Rack',
        shelves: [
          { code: '01', label: 'Shelf 1' },
          { code: '02', label: 'Shelf 2' },
          { code: '03', label: 'Shelf 3' },
          { code: '04', label: 'Shelf 4' },
          { code: 'BT', label: 'Bottom Storage' },
        ],
      },
      {
        code: 'R',
        name: 'Right Storage Rack',
        shelves: [
          { code: '01', label: 'Shelf 1' },
          { code: '02', label: 'Shelf 2' },
          { code: '03', label: 'Shelf 3' },
          { code: '04', label: 'Shelf 4' },
        ],
      },
      {
        code: 'TS',
        name: 'Top Wall Shelf',
        shelves: [{ code: 'TS', label: 'Top Wall Shelf' }],
      },
    ],
  },
  {
    code: 'RS',
    name: 'Right Storage Room',
    description: 'Accessories & Reserve Stock',
    zones: [
      {
        code: 'AR',
        name: 'Accessory Rack',
        shelves: [
          { code: '01', label: 'Shelf 1' },
          { code: '02', label: 'Shelf 2' },
          { code: '03', label: 'Shelf 3' },
          { code: '04', label: 'Shelf 4' },
          { code: '05', label: 'Shelf 5' },
          { code: 'BT', label: 'Bottom Storage' },
        ],
      },
      {
        code: 'TS',
        name: 'Top Shelf Reserve',
        shelves: [{ code: 'TS', label: 'Top Shelf' }],
      },
    ],
  },
  {
    code: 'SR',
    name: 'Main Showroom',
    description: 'Customer display tables & racks',
    zones: [
      {
        code: 'FR',
        name: 'Front Display Rack',
        shelves: [
          { code: '01', label: 'Level 1' },
          { code: '02', label: 'Level 2' },
          { code: '03', label: 'Level 3' },
          { code: '04', label: 'Level 4' },
          { code: '05', label: 'Level 5' },
          { code: '06', label: 'Level 6' },
        ],
      },
      {
        code: 'DT',
        name: 'Center Display Table',
        shelves: [{ code: 'DT', label: 'Main Table Surface' }],
      },
      {
        code: 'DB',
        name: 'Under Display Table',
        shelves: [{ code: 'DB', label: 'Under Table Backup' }],
      },
      {
        code: 'WD',
        name: 'Window Display',
        shelves: [{ code: 'WD', label: 'Window Display' }],
      },
      {
        code: 'FL',
        name: 'Floor Display',
        shelves: [{ code: 'FL', label: 'Floor Display' }],
      },
    ],
  },
  {
    code: 'GD',
    name: 'Glass Display Section',
    description: 'Premium customer-facing displays',
    zones: [
      {
        code: 'L',
        name: 'Left Glass Display',
        shelves: [{ code: 'L', label: 'Left Glass' }],
      },
      {
        code: 'R',
        name: 'Right Glass Display',
        shelves: [{ code: 'R', label: 'Right Glass' }],
      },
      {
        code: 'FW',
        name: 'Footwear Storage',
        shelves: [{ code: 'FW', label: 'Footwear Section' }],
      },
    ],
  },
  {
    code: 'CR',
    name: 'Category Rack',
    description: 'Storage levels with separate compartments',
    zones: [
      {
        code: '00',
        name: 'Left Rack',
        shelves: [
          { code: '1', label: 'Compartment 1' },
          { code: '2', label: 'Compartment 2' },
          { code: '3', label: 'Compartment 3' },
        ],
      },
      {
        code: '01',
        name: 'Level 1 (Top)',
        shelves: [{ code: 'Top', label: 'Top Shelf (Garments)' }],
      },
      {
        code: '02',
        name: 'Level 2',
        shelves: [
          { code: 'A', label: 'Dhoti Section (02A)' },
          { code: 'B', label: 'Jeans Bottom (02B)' },
        ],
      },
      {
        code: '03',
        name: 'Level 3',
        shelves: [
          { code: 'A', label: 'Boys Wear (03A)' },
          { code: 'B', label: 'Sarees (03B)' },
        ],
      },
      {
        code: '04',
        name: 'Level 4',
        shelves: [
          { code: 'A', label: 'Girls Wear (04A)' },
          { code: 'B', label: 'Children\'s (04B)' },
        ],
      },
    ],
  },
];

export default function AdminInventoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];

  const [searchVal, setSearchVal] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Active filters on physical layout
  const [activeAreaCode, setActiveAreaCode] = useState<string>('LS');
  const [activeZoneCode, setActiveZoneCode] = useState<string | null>(null);
  const [activeShelfCode, setActiveShelfCode] = useState<string | null>(null);

  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchVal.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchVal]);

  // Load all products (needed for calculating visual indicators)
  const { data: allProducts, isLoading: loadingAll, refetch, isRefetching } = useProducts();

  const handleUpdateStock = async (product: Product, change: number) => {
    const newQty = product.stock_quantity + change;
    if (newQty < 0) {
      Alert.alert('Cannot Deduct', 'Stock quantity cannot be negative.');
      return;
    }

    setUpdatingProductId(product.id);
    try {
      const docRef = doc(db, 'products', product.id);

      await updateDoc(docRef, {
        stock_quantity: newQty,
        updated_at: new Date().toISOString(),
      });

      const actionType = change > 0 ? 'RESTOCK' : 'SALE';
      await addDoc(collection(db, 'inventory_logs'), {
        product_id: product.id,
        product_name: product.name,
        previous_stock: product.stock_quantity,
        new_stock: newQty,
        action_type: actionType,
        created_at: new Date().toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory_logs'] });
      refetch();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to update stock quantity.');
    } finally {
      setUpdatingProductId(null);
    }
  };

  // Helper to compile matching code based on selections
  const buildLocationCode = (area: string, zone: string, shelf: string): string => {
    if (area === 'GD') {
      return `GD-${shelf}`;
    }
    if (area === 'CR') {
      if (zone === '01') return 'CR-01';
      if (zone === '00') return `CR-00-${shelf}`;
      return `CR-${zone}${shelf}`;
    }
    if (zone === shelf) {
      return `${area}-${zone}`;
    }
    return `${area}-${zone}-${shelf}`;
  };

  // Count items matching a specific location code or partial match
  const countItemsInLocation = (area: string, zone?: string, shelf?: string): number => {
    if (!allProducts) return 0;

    return allProducts.filter((p) => {
      const loc = p.storage_location;
      if (!loc) return false;

      if (shelf && zone) {
        return loc === buildLocationCode(area, zone, shelf);
      }
      if (zone) {
        return loc.startsWith(`${area}-${zone}`) || (area === 'CR' && loc.startsWith(`CR-${zone}`));
      }
      return loc.startsWith(area);
    }).length;
  };

  // Filter products list based on active selections + search
  const getFilteredProducts = () => {
    if (!allProducts) return [];

    let filtered = allProducts;

    // Filter by visual map selection
    if (activeShelfCode && activeZoneCode) {
      const targetCode = buildLocationCode(activeAreaCode, activeZoneCode, activeShelfCode);
      filtered = filtered.filter((p) => p.storage_location === targetCode);
    } else if (activeZoneCode) {
      filtered = filtered.filter((p) => {
        const loc = p.storage_location;
        if (!loc) return false;
        if (activeAreaCode === 'CR') {
          return loc.startsWith(`CR-${activeZoneCode}`);
        }
        return loc.startsWith(`${activeAreaCode}-${activeZoneCode}`);
      });
    } else if (activeAreaCode) {
      filtered = filtered.filter((p) => p.storage_location?.startsWith(activeAreaCode));
    }

    // Filter by text search
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.storage_location?.toLowerCase().includes(term) ||
          p.subcategory?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const handleAreaPress = (code: string) => {
    setActiveAreaCode(code);
    setActiveZoneCode(null);
    setActiveShelfCode(null);
  };

  const handleZonePress = (code: string) => {
    if (activeZoneCode === code) {
      // Toggle off
      setActiveZoneCode(null);
      setActiveShelfCode(null);
    } else {
      setActiveZoneCode(code);
      setActiveShelfCode(null);
    }
  };

  const handleShelfPress = (shelfCode: string) => {
    if (activeShelfCode === shelfCode) {
      setActiveShelfCode(null);
    } else {
      setActiveShelfCode(shelfCode);
    }
  };

  const selectedArea = LOCATION_PLAN.find((a) => a.code === activeAreaCode);

  const renderProductRow = ({ item }: { item: Product }) => {
    const mainImage = item.product_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300';
    const isOutOfStock = item.stock_quantity === 0;
    const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= 3;
    const isUpdating = updatingProductId === item.id;

    let stockColor = '#34C759';
    let stockStatusText = 'In Stock';
    if (isOutOfStock) {
      stockColor = '#FF3B30';
      stockStatusText = 'Out of Stock';
    } else if (isLowStock) {
      stockColor = '#FF9500';
      stockStatusText = `Low Stock (${item.stock_quantity})`;
    }

    return (
      <View style={[styles.productRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <CachedImage source={{ uri: mainImage }} style={styles.productImage} />
        <View style={styles.infoCol}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.productMeta, { color: colors.textSecondary }]}>
            {item.categories?.name} • {item.subcategory}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={[styles.locationBadge, { color: colors.accent, backgroundColor: colors.accent + '15' }]}>
              📍 {item.storage_location}
            </Text>
          </View>
        </View>

        <View style={styles.controlCol}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
            ${item.price}
          </Text>
          <View style={styles.counter}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.backgroundSelected }]}
              onPress={() => handleUpdateStock(item, -1)}
              disabled={isUpdating || isOutOfStock}
            >
              <Minus size={12} color={isOutOfStock ? colors.textSecondary : colors.text} />
            </TouchableOpacity>

            <View style={styles.qtyBox}>
              {isUpdating ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[styles.qtyVal, { color: colors.text }]}>{item.stock_quantity}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.backgroundSelected }]}
              onPress={() => handleUpdateStock(item, 1)}
              disabled={isUpdating}
            >
              <Plus size={12} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.backgroundSelected }]}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>STORE LAYOUT & INVENTORY</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.backgroundSelected }]} onPress={() => refetch()}>
          <RefreshCw size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* GRAPHICAL SHIPPMENT / STORE MAP */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INTERACTIVE STORE FLOOR MAP</Text>
        
        <View style={[styles.mapContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          {/* Map layout representing areas in store */}
          <View style={styles.mapGrid}>
            
            {/* Left Column (Left Storage room) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.mapBlock,
                styles.leftStorageBlock,
                {
                  borderColor: activeAreaCode === 'LS' ? colors.accent : colors.border,
                  backgroundColor: activeAreaCode === 'LS' ? colors.accent + '15' : colors.backgroundSelected,
                },
              ]}
              onPress={() => handleAreaPress('LS')}
            >
              <Text style={[styles.blockLabel, { color: colors.text }]}>LEFT STORAGE</Text>
              <Text style={[styles.blockCode, { color: colors.textSecondary }]}>LS Room</Text>
              <View style={styles.blockIndicator}>
                <Text style={styles.indicatorText}>{countItemsInLocation('LS')} Items</Text>
              </View>
            </TouchableOpacity>

            {/* Center Column: Category Rack (top) and Showroom (middle) and Glass Display (bottom) */}
            <View style={styles.centerMapColumn}>
              {/* Category Rack (CR) */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mapBlock,
                  styles.categoryRackBlock,
                  {
                    borderColor: activeAreaCode === 'CR' ? colors.accent : colors.border,
                    backgroundColor: activeAreaCode === 'CR' ? colors.accent + '15' : colors.backgroundSelected,
                  },
                ]}
                onPress={() => handleAreaPress('CR')}
              >
                <Text style={[styles.blockLabel, { color: colors.text }]}>CATEGORY RACK</Text>
                <Text style={[styles.blockCode, { color: colors.textSecondary }]}>CR (4 Levels)</Text>
                <View style={styles.blockIndicator}>
                  <Text style={styles.indicatorText}>{countItemsInLocation('CR')} Items</Text>
                </View>
              </TouchableOpacity>

              {/* Main Showroom (SR) */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mapBlock,
                  styles.showroomBlock,
                  {
                    borderColor: activeAreaCode === 'SR' ? colors.accent : colors.border,
                    backgroundColor: activeAreaCode === 'SR' ? colors.accent + '15' : colors.backgroundSelected,
                  },
                ]}
                onPress={() => handleAreaPress('SR')}
              >
                <Text style={[styles.blockLabel, { color: colors.text }]}>MAIN SHOWROOM</Text>
                <Text style={[styles.blockCode, { color: colors.textSecondary }]}>SR Display</Text>
                <View style={styles.blockIndicator}>
                  <Text style={styles.indicatorText}>{countItemsInLocation('SR')} Items</Text>
                </View>
              </TouchableOpacity>

              {/* Glass Display (GD) */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mapBlock,
                  styles.glassDisplayBlock,
                  {
                    borderColor: activeAreaCode === 'GD' ? colors.accent : colors.border,
                    backgroundColor: activeAreaCode === 'GD' ? colors.accent + '15' : colors.backgroundSelected,
                  },
                ]}
                onPress={() => handleAreaPress('GD')}
              >
                <Text style={[styles.blockLabel, { color: colors.text }]}>GLASS DISPLAY</Text>
                <Text style={[styles.blockCode, { color: colors.textSecondary }]}>GD Premium</Text>
                <View style={styles.blockIndicator}>
                  <Text style={styles.indicatorText}>{countItemsInLocation('GD')} Items</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Right Column (Right Storage room) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.mapBlock,
                styles.rightStorageBlock,
                {
                  borderColor: activeAreaCode === 'RS' ? colors.accent : colors.border,
                  backgroundColor: activeAreaCode === 'RS' ? colors.accent + '15' : colors.backgroundSelected,
                },
              ]}
              onPress={() => handleAreaPress('RS')}
            >
              <Text style={[styles.blockLabel, { color: colors.text }]}>RIGHT STORAGE</Text>
              <Text style={[styles.blockCode, { color: colors.textSecondary }]}>RS Room</Text>
              <View style={styles.blockIndicator}>
                <Text style={styles.indicatorText}>{countItemsInLocation('RS')} Items</Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* DETAILS OF SELECTED AREA */}
        {selectedArea && (
          <View style={[styles.areaDetailsCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={styles.areaDetailsHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.areaName, { color: colors.text }]}>{selectedArea.name.toUpperCase()}</Text>
                <Text style={[styles.areaDesc, { color: colors.textSecondary }]}>{selectedArea.description}</Text>
              </View>
              <View style={[styles.areaBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.areaBadgeText}>{countItemsInLocation(selectedArea.code)} ITEMS</Text>
              </View>
            </View>

            {/* Visual shelf stack inside the selected area */}
            <Text style={[styles.subTitle, { color: colors.textSecondary, marginTop: 16 }]}>SELECT A SHELF / RACK TO FILTER</Text>
            
            <View style={styles.rackVisualizer}>
              {selectedArea.zones.map((zone) => {
                const isZoneActive = activeZoneCode === zone.code;
                
                return (
                  <View key={zone.code} style={[styles.zoneVisualRow, { borderColor: isZoneActive ? colors.accent : colors.border }]}>
                    <TouchableOpacity
                      style={[styles.zoneHeaderBtn, { backgroundColor: isZoneActive ? colors.accent + '20' : colors.backgroundSelected }]}
                      onPress={() => handleZonePress(zone.code)}
                    >
                      <Text style={[styles.zoneHeaderText, { color: colors.text }]}>{zone.name}</Text>
                      <Text style={{ fontSize: 10, color: colors.accent, fontWeight: '700' }}>
                        {countItemsInLocation(selectedArea.code, zone.code)} Items
                      </Text>
                    </TouchableOpacity>

                    {isZoneActive && (
                      <View style={styles.shelvesStack}>
                        {zone.shelves.map((shelf) => {
                          const isShelfActive = activeShelfCode === shelf.code;
                          const count = countItemsInLocation(selectedArea.code, zone.code, shelf.code);

                          return (
                            <TouchableOpacity
                              key={shelf.code}
                              style={[
                                styles.shelfItem,
                                {
                                  backgroundColor: isShelfActive ? colors.text : colors.backgroundSelected,
                                  borderColor: isShelfActive ? colors.text : colors.border,
                                },
                              ]}
                              onPress={() => handleShelfPress(shelf.code)}
                            >
                              <Text style={[styles.shelfLabel, { color: isShelfActive ? colors.background : colors.text }]}>
                                {shelf.label} ({buildLocationCode(selectedArea.code, zone.code, shelf.code)})
                              </Text>
                              <View style={[styles.shelfPill, { backgroundColor: count > 0 ? colors.accent : 'rgba(0,0,0,0.05)' }]}>
                                <Text style={{ color: count > 0 ? '#FFF' : colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                                  {count}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SEARCH AND FILTERS */}
        <View style={styles.actionsBar}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 12 }]}>FILTERED ITEMS LIST</Text>
          { (activeZoneCode || activeShelfCode) && (
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() => {
                setActiveZoneCode(null);
                setActiveShelfCode(null);
              }}
            >
              <Text style={{ fontSize: 11, color: colors.accent, fontWeight: '700' }}>CLEAR RACK FILTER</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.searchWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.border, marginHorizontal: 20, marginBottom: 12 }]}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search items by name or tags..."
            placeholderTextColor={colors.textSecondary}
            value={searchVal}
            onChangeText={setSearchVal}
          />
        </View>

        {/* ITEMS LIST */}
        {loadingAll ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <FlatList
            scrollEnabled={false} // Nested inside parent ScrollView
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProductRow}
            contentContainerStyle={styles.list}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No items matching this shelf selector or search parameters.
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  mapContainer: {
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  mapGrid: {
    flexDirection: 'row',
    height: 260,
    gap: 10,
  },
  mapBlock: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftStorageBlock: {
    flex: 1.2,
    height: '100%',
  },
  rightStorageBlock: {
    flex: 1.2,
    height: '100%',
  },
  centerMapColumn: {
    flex: 2,
    gap: 8,
    height: '100%',
  },
  categoryRackBlock: {
    flex: 1,
    width: '100%',
  },
  showroomBlock: {
    flex: 1.8,
    width: '100%',
  },
  glassDisplayBlock: {
    flex: 1,
    width: '100%',
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  blockCode: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  blockIndicator: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  indicatorText: {
    fontSize: 9,
    fontWeight: '700',
  },
  areaDetailsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  areaDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 12,
  },
  areaName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  areaDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  areaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  areaBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
  subTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  rackVisualizer: {
    gap: 10,
  },
  zoneVisualRow: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  zoneHeaderBtn: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  shelvesStack: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  shelfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  shelfLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  shelfPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 20,
    marginTop: 12,
  },
  clearFiltersBtn: {
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  list: {
    marginHorizontal: 20,
    gap: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  productImage: {
    width: 50,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
  },
  productMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  locationBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  controlCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    marginHorizontal: 20,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
