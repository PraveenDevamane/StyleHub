import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavoritesStore } from '../store/favoritesStore';
import { Heart, Trash2, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { getDirectDriveUrl } from '../utils/image';

export default function Wishlist() {
  const navigate = useNavigate();
  const { favorites, removeFavorite, clearFavorites } = useFavoritesStore();

  const handleRemove = (e, id) => {
    e.stopPropagation();
    removeFavorite(id);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px', paddingTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>My Wishlist</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={clearFavorites}
            className="btn btn-ghost"
            style={{ color: '#EF4444', fontWeight: '600', fontSize: '0.85rem' }}
          >
            Clear All
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', maxWidth: '480px', margin: '0 auto' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Heart size={36} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Your Wishlist is Empty</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Tap the heart icon on items to save them here for later reviews.
          </p>
          <button onClick={() => navigate('/home')} className="btn btn-primary">
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid-cols-auto">
          {favorites.map((item) => {
            const mainImage = item.image_urls?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500';
            const hasDiscount = Boolean(item.discounted_price);

            return (
              <GlassCard
                key={item.id}
                className="interactive-card"
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '10px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => navigate(`/product/${item.id}`)}
              >
                {/* Remove from wishlist */}
                <button
                  onClick={(e) => handleRemove(e, item.id)}
                  style={{
                    position: 'absolute',
                    top: '18px',
                    right: '18px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                >
                  <Trash2 size={16} color="#EF4444" />
                </button>

                <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={getDirectDriveUrl(mainImage)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ padding: '12px 6px 6px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{item.categories?.name}</p>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text)', margin: '4px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '750', color: 'var(--accent)' }}>
                      ${hasDiscount ? item.discounted_price : item.price}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                        ${item.price}
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
