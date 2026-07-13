import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Star, AlertTriangle, ListFilter, Plus, RefreshCw, Layers, ClipboardList } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ShimmerLoader from '../components/ShimmerLoader';
import { getAdminAuthHeaders } from '../services/authHeaders';

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Fetch all products
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('API failure');
      return res.json();
    },
  });

  // Fetch recent logs
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const res = await fetch('/api/products/logs', {
        headers: await getAdminAuthHeaders(),
      });
      if (!res.ok) throw new Error('API failure');
      return res.json();
    },
  });

  const handleRefresh = async () => {
    await Promise.all([refetchProducts(), refetchLogs()]);
  };

  const totalProducts = products?.length || 0;
  const featuredCount = products?.filter((p) => p.featured).length || 0;
  const outOfStockCount = products?.filter((p) => p.stock_quantity === 0).length || 0;
  const lowStockCount = products?.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 3).length || 0;

  if (productsLoading || logsLoading) {
    return (
      <div className="container" style={{ padding: '60px 28px', display: 'flex', justifyContent: 'center' }}>
        <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '80px', paddingTop: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Monitor and organize catalog items and shelf placements.
          </p>
        </div>
        <button onClick={handleRefresh} className="btn btn-secondary flex-row" style={{ gap: '6px' }}>
          <RefreshCw size={16} /> Refresh Metrics
        </button>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}
      >
        <GlassCard style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <Package size={24} color="var(--accent)" style={{ marginBottom: '12px' }} />
          <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{totalProducts}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Catalog</span>
        </GlassCard>

        <GlassCard style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <Star size={24} color="#F59E0B" style={{ marginBottom: '12px' }} />
          <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{featuredCount}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Featured Items</span>
        </GlassCard>

        <GlassCard
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            border: outOfStockCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--card-border)',
          }}
        >
          <AlertTriangle size={24} color="#EF4444" style={{ marginBottom: '12px' }} />
          <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{outOfStockCount}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Out of Stock</span>
        </GlassCard>

        <GlassCard
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            border: lowStockCount > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--card-border)',
          }}
        >
          <AlertTriangle size={24} color="#F59E0B" style={{ marginBottom: '12px' }} />
          <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{lowStockCount}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Low Stock (≤ 3)</span>
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Quick Operations links */}
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
            Catalog Operations
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              to="/admin/inventory"
              className="glass-panel flex-row"
              style={{
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '12px',
                transition: 'all 0.2s',
              }}
            >
              <div className="flex-row" style={{ gap: '12px' }}>
                <ClipboardList size={20} color="var(--accent)" />
                <span style={{ fontWeight: '600', color: 'var(--text)' }}>Manage Products Catalog</span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  backgroundColor: 'var(--background-selected)',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  color: 'var(--text)',
                }}
              >
                {totalProducts} items
              </span>
            </Link>

            <Link
              to="/admin/categories"
              className="glass-panel flex-row"
              style={{
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '12px',
                transition: 'all 0.2s',
              }}
            >
              <div className="flex-row" style={{ gap: '12px' }}>
                <Layers size={20} color="var(--accent)" />
                <span style={{ fontWeight: '600', color: 'var(--text)' }}>Manage Categories</span>
              </div>
            </Link>

            <Link
              to="/admin/editor"
              className="glass-panel flex-row"
              style={{
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '12px',
                transition: 'all 0.2s',
                border: '1.5px solid var(--accent)',
              }}
            >
              <div className="flex-row" style={{ gap: '12px' }}>
                <Plus size={20} color="var(--accent)" />
                <span style={{ fontWeight: '700', color: 'var(--text)' }}>Add New Product</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent logs */}
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
            Recent Inventory Actions
          </h2>
          <GlassCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {logs && logs.length > 0 ? (
              logs.map((log) => {
                const date = new Date(log.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                let badgeBg = 'rgba(16, 185, 129, 0.12)';
                let badgeColor = '#10B981';
                if (log.action_type === 'SALE') {
                  badgeBg = 'rgba(239, 68, 68, 0.12)';
                  badgeColor = '#EF4444';
                } else if (log.action_type === 'INITIAL') {
                  badgeBg = 'rgba(59, 130, 246, 0.12)';
                  badgeColor = '#3B82F6';
                }

                return (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border)',
                      paddingBottom: '12px',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        {log.products?.name || 'Unknown Product'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {date} • Stock: {log.previous_stock} → {log.new_stock}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {log.action_type}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No recent actions logged.
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
