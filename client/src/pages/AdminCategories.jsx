import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ListFilter, AlertCircle, Layers } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ShimmerLoader from '../components/ShimmerLoader';
import Button from '../components/Button';
import { showAlert } from '../utils/alert';
import { getAdminAuthHeaders } from '../services/authHeaders';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch current categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('API failure');
      return res.json();
    },
  });

  // Category addition mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (name) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: await getAdminAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setNewCategoryName('');
      showAlert('Success', 'Category added successfully!');
    },
    onError: (err) => {
      showAlert('Error', err.message || 'Failed to add category');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      showAlert('Warning', 'Category name cannot be empty');
      return;
    }
    addCategoryMutation.mutate(name);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px', paddingTop: '20px', maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Manage Categories</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Define the primary catalog divisions for product classification.
        </p>
      </div>

      {/* Add Category Form */}
      <GlassCard style={{ padding: '24px', marginBottom: '32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">New Category Name</label>
            <input
              type="text"
              placeholder="e.g. Traditional Wear, Athleisure..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="form-input"
            />
          </div>
          <Button type="submit" disabled={addCategoryMutation.isPending} className="flex-row" style={{ height: '48px', padding: '0 24px' }}>
            <Plus size={18} /> Add
          </Button>
        </form>
      </GlassCard>

      {/* Category List */}
      <GlassCard style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
          Active Categories
        </h3>
        
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ShimmerLoader height="40px" />
            <ShimmerLoader height="40px" />
            <ShimmerLoader height="40px" />
          </div>
        ) : !categories || categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>No categories defined yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--background-element)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              >
                <div className="flex-row" style={{ gap: '10px' }}>
                  <Layers size={16} color="var(--accent)" />
                  <span style={{ fontWeight: '600', color: 'var(--text)' }}>{cat.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  ID: {cat.id}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
