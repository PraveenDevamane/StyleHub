import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Package, Star, AlertTriangle, ListFilter, Plus, RefreshCw, Layers, ClipboardList } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/services/firebase';
import { collection, query, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';
import Button from '@/components/Button';
import GlassCard from '@/components/GlassCard';
import { InventoryLog } from '@/types';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const colors = Colors[theme];
  
  const { signOut } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all products to calculate dashboard metrics
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useProducts({ sortBy: 'newest' });

  // Fetch recent inventory logs
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery<InventoryLog[]>({
    queryKey: ['admin', 'inventory_logs'],
    queryFn: async () => {
      const q = query(
        collection(db, 'inventory_logs'),
        orderBy('created_at', 'desc'),
        firestoreLimit(5)
      );
      const snap = await getDocs(q);

      return snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          products: {
            name: data.product_name || 'Unknown Product',
          },
        };
      }) as any[];
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProducts(), refetchLogs()]);
    setRefreshing(false);
  };

  const handleSignOut = () => {
    signOut().then(() => {
      router.replace('/(customer)/profile');
    });
  };

  // Metrics Calculations
  const totalProducts = products?.length || 0;
  const featuredCount = products?.filter((p) => p.featured).length || 0;
  const outOfStockCount = products?.filter((p) => p.stock_quantity === 0).length || 0;
  const lowStockCount = products?.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 3).length || 0;

  if (productsLoading || logsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ADMIN DASHBOARD</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
          <LogOut size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          <GlassCard style={styles.metricCard}>
            <Package size={22} color={colors.accent} style={{ marginBottom: 8 }} />
            <Text style={[styles.metricValue, { color: colors.text }]}>{totalProducts}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Catalog</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <Star size={22} color="#FFCC00" style={{ marginBottom: 8 }} />
            <Text style={[styles.metricValue, { color: colors.text }]}>{featuredCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Featured Items</Text>
          </GlassCard>

          <GlassCard style={[styles.metricCard, outOfStockCount > 0 ? { borderColor: 'rgba(255, 59, 48, 0.3)' } : {}]}>
            <AlertTriangle size={22} color="#FF3B30" style={{ marginBottom: 8 }} />
            <Text style={[styles.metricValue, { color: colors.text }]}>{outOfStockCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Out of Stock</Text>
          </GlassCard>

          <GlassCard style={[styles.metricCard, lowStockCount > 0 ? { borderColor: 'rgba(255, 149, 0, 0.3)' } : {}]}>
            <AlertTriangle size={22} color="#FF9500" style={{ marginBottom: 8 }} />
            <Text style={[styles.metricValue, { color: colors.text }]}>{lowStockCount}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Low Stock (≤ 3)</Text>
          </GlassCard>
        </View>

        {/* Quick Actions Panel */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CATALOG OPERATIONS</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/admin/products')}
          >
            <View style={styles.actionLeft}>
              <Layers size={18} color={colors.text} style={{ marginRight: 12 }} />
              <Text style={[styles.actionText, { color: colors.text }]}>Manage Products Catalog</Text>
            </View>
            <View style={[styles.actionCount, { backgroundColor: colors.backgroundSelected }]}>
              <Text style={[styles.actionCountText, { color: colors.text }]}>{totalProducts}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/admin/categories')}
          >
            <View style={styles.actionLeft}>
              <Layers size={18} color={colors.text} style={{ marginRight: 12 }} />
              <Text style={[styles.actionText, { color: colors.text }]}>Manage Categories</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/admin/inventory' as any)}
          >
            <View style={styles.actionLeft}>
              <ClipboardList size={18} color={colors.text} style={{ marginRight: 12 }} />
              <Text style={[styles.actionText, { color: colors.text }]}>Manage Store Inventory (Aisles/Stock)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => router.push('/admin/products/editor')}
          >
            <View style={styles.actionLeft}>
              <Plus size={18} color={colors.accent} style={{ marginRight: 12 }} />
              <Text style={[styles.actionText, { color: colors.text, fontWeight: '700' }]}>Add New Product</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Inventory Logs */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT INVENTORY ACTIONS</Text>
        <View style={[styles.logsContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          {logs && logs.length > 0 ? (
            logs.map((log) => {
              const date = new Date(log.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              let badgeBg = 'rgba(52, 199, 89, 0.1)';
              let badgeColor = '#34C759';
              if (log.action_type === 'SALE') {
                badgeBg = 'rgba(255, 59, 48, 0.1)';
                badgeColor = '#FF3B30';
              } else if (log.action_type === 'INITIAL') {
                badgeBg = 'rgba(0, 122, 255, 0.1)';
                badgeColor = '#007AFF';
              }

              return (
                <View key={log.id} style={[styles.logRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.logProduct, { color: colors.text }]} numberOfLines={1}>
                      {log.products?.name || 'Unknown Product'}
                    </Text>
                    <Text style={[styles.logMeta, { color: colors.textSecondary }]}>
                      {date} • Stock: {log.previous_stock} → {log.new_stock}
                    </Text>
                  </View>
                  <View style={[styles.logBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.logBadgeText, { color: badgeColor }]}>{log.action_type}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyLogs}>
              <Text style={[styles.emptyLogsText, { color: colors.textSecondary }]}>
                No inventory changes logged yet.
              </Text>
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
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  logoutBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  actionsContainer: {
    marginBottom: 28,
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logsContainer: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  logProduct: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  logMeta: {
    fontSize: 11,
  },
  logBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyLogs: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyLogsText: {
    fontSize: 13,
  },
});
