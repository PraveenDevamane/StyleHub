import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Edit, Trash2, Plus, AlertCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ShimmerLoader from '../components/ShimmerLoader';
import { showConfirm, showAlert } from '../utils/alert';
import { getAdminAuthHeaders } from '../services/authHeaders';

export default function AdminInventory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all products
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('API failure');
      return res.json();
    },
  });

  // Deletion mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: await getAdminAuthHeaders(),
      });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      showAlert('Success', 'Product deleted successfully!');
    },
    onError: (err) => {
      showAlert('Error', err.message || 'Failed to delete product');
    },
  });

  const handleDelete = async (id, name) => {
    const confirm = await showConfirm('Confirm Delete', `Are you sure you want to delete "${name}"? This action cannot be undone.`);
    if (confirm) {
      deleteMutation.mutate(id);
    }
  };

  const filteredProducts = products?.filter((p) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      (p.product_code || '').toLowerCase().includes(term) ||
      (p.subcategory || '').toLowerCase().includes(term) ||
      (p.categories?.name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px', paddingTop: '20px' }}>
      <style>{`
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        th, td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }
        th {
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 1px;
        }
        tr:hover {
          background-color: var(--background-element);
        }
        @media (max-width: 768px) {
          .table-responsive {
            overflow-x: auto;
          }
          th.hide-tablet, td.hide-tablet {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Inventory Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Search, edit details, or remove products from the catalog.
          </p>
        </div>
        <button onClick={() => navigate('/admin/editor')} className="btn btn-primary flex-row" style={{ gap: '6px' }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', maxWidth: '480px', marginBottom: '24px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          placeholder="Search by name, code, category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '44px' }}
        />
      </div>

      {/* Inventory Table */}
      <GlassCard style={{ padding: '8px 0', overflow: 'hidden' }}>
        <div className="table-responsive">
          {isLoading ? (
            <div style={{ padding: '32px' }}>
              <ShimmerLoader height="36px" style={{ marginBottom: '12px' }} />
              <ShimmerLoader height="36px" style={{ marginBottom: '12px' }} />
              <ShimmerLoader height="36px" style={{ marginBottom: '12px' }} />
            </div>
          ) : !filteredProducts || filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No inventory items match your search criteria.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="hide-tablet">Code</th>
                  <th>Category</th>
                  <th className="hide-tablet">Subcategory</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--text)' }}>{p.name}</span>
                    </td>
                    <td className="hide-tablet">
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.product_code || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.categories?.name}</span>
                    </td>
                    <td className="hide-tablet">
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.subcategory || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--accent)' }}>
                        ${p.discounted_price || p.price}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: '700',
                          color: p.stock_quantity === 0 ? '#EF4444' : p.stock_quantity <= 3 ? '#F59E0B' : '#10B981',
                        }}
                      >
                        {p.stock_quantity} units
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          backgroundColor: 'var(--background-selected)',
                          color: 'var(--text)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {p.storage_location || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => navigate(`/admin/editor?productId=${p.id}`)}
                          className="btn btn-ghost"
                          style={{ padding: '8px', borderRadius: '50%' }}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="btn btn-ghost"
                          style={{ padding: '8px', borderRadius: '50%', color: '#EF4444' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
