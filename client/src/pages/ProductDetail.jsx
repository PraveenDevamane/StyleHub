import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useFavoritesStore } from '../store/favoritesStore';
import { Heart, ArrowLeft, Tag, ShoppingBag, Layers, AlertCircle } from 'lucide-react';
import ShimmerLoader from '../components/ShimmerLoader';
import GlassCard from '../components/GlassCard';
import { getDirectDriveUrl } from '../utils/image';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch product detail and similar items
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      const json = await res.json();
      // Set initial selected image once data loads
      if (json.product?.image_urls?.length > 0) {
        setSelectedImage(json.product.image_urls[0]);
      }
      return json;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container animate-fade-in" style={{ padding: '40px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '40px' }}>
          <ShimmerLoader height="480px" borderRadius="16px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ShimmerLoader width="60%" height="28px" />
            <ShimmerLoader width="30%" height="20px" />
            <ShimmerLoader width="90%" height="80px" />
            <ShimmerLoader width="40%" height="48px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container" style={{ padding: '60px 28px', textAlign: 'center' }}>
        <AlertCircle size={48} color="red" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Product Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>The item you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/home')} className="btn btn-primary">Go Home</button>
      </div>
    );
  }

  const { product, similarProducts } = data;
  const isFav = isFavorite(product.id);
  const images = product.image_urls?.length > 0 ? product.image_urls : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500'];
  const currentImage = selectedImage || images[0];
  const hasDiscount = Boolean(product.discounted_price);

  const handleWishlistToggle = () => {
    if (isFav) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
    }
  };

  const handleSimilarClick = (simId) => {
    setSelectedImage(null);
    navigate(`/product/${simId}`);
  };

  return (
    <div className="container" style={{ paddingBottom: '80px', paddingTop: '20px' }}>
      {/* Back navigation */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost flex-row" style={{ gap: '6px', marginBottom: '24px', paddingLeft: 0 }}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Main Grid */}
      <div className="product-detail-grid">
        {/* Left Side: Images Section */}
        <div>
          {/* Main Visual Display */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '460px',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              backgroundColor: 'var(--background-element)',
              marginBottom: '16px',
            }}
          >
            <img
              src={getDirectDriveUrl(currentImage)}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {hasDiscount && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--background-element)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  padding: '6px 12px',
                  borderRadius: '6px',
                }}
              >
                SALE ACTIVE
              </div>
            )}
          </div>

          {/* Thumbnail list */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '8px',
                    border: currentImage === img ? '2px solid var(--accent)' : '1px solid var(--border)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--background-element)',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    transition: 'border 0.2s',
                  }}
                >
                  <img src={getDirectDriveUrl(img)} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Meta Details */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {product.categories?.name}
          </span>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--text)', margin: '8px 0 16px', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
            {product.name}
          </h1>

          {/* Pricing Box */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent)' }}>
              ${hasDiscount ? product.discounted_price : product.price}
            </span>
            {hasDiscount && (
              <>
                <span style={{ fontSize: '1.25rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                  ${product.price}
                </span>
                <span style={{ color: '#10B981', fontWeight: '700', fontSize: '0.95rem' }}>
                  ({Math.round(((product.price - product.discounted_price) / product.price) * 100)}% off)
                </span>
              </>
            )}
          </div>

          {/* Metadata Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
              <Layers size={14} color="var(--accent)" />
              <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Sub:</span>
              <span style={{ color: 'var(--text)', fontWeight: '700' }}>{product.subcategory || 'General'}</span>
            </GlassCard>
            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
              <Tag size={14} color="var(--accent)" />
              <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Code:</span>
              <span style={{ color: 'var(--text)', fontWeight: '700' }}>{product.product_code || 'N/A'}</span>
            </GlassCard>
            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
              <ShoppingBag size={14} color="var(--accent)" />
              <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Stock:</span>
              <span style={{ color: product.stock_quantity > 0 ? '#10B981' : '#EF4444', fontWeight: '700' }}>
                {product.stock_quantity > 0 ? `${product.stock_quantity} units` : 'Out of stock'}
              </span>
            </GlassCard>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
            <button
              onClick={handleWishlistToggle}
              className={`btn ${isFav ? 'btn-secondary' : 'btn-primary'}`}
              style={{ flex: 1, height: '48px', fontSize: '1rem' }}
            >
              <Heart size={20} fill={isFav ? '#FF3B30' : 'none'} color={isFav ? '#FF3B30' : 'var(--background-element)'} />
              {isFav ? 'Saved in Wishlist' : 'Add to Wishlist'}
            </button>
          </div>

          {/* Description */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text)', marginBottom: '8px' }}>Product Description</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {product.description || 'No description available for this premium piece.'}
            </p>
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '8px' }}>Tags</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      backgroundColor: 'var(--tint)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar products section */}
      {similarProducts?.length > 0 && (
        <section style={{ borderTop: '1px solid var(--border)', paddingTop: '48px' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text)', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>You May Also Like</h2>
          <div className="grid-cols-auto">
            {similarProducts.map((item) => {
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
                  }}
                  onClick={() => handleSimilarClick(item.id)}
                >
                  <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden' }}>
                    <img src={getDirectDriveUrl(mainImage)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '12px 6px 6px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{item.categories?.name}</p>
                    <h4 style={{ fontSize: '1.0rem', color: 'var(--text)', margin: '4px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</h4>
                    <span style={{ fontWeight: '700', color: 'var(--accent)' }}>
                      ${hasDiscount ? item.discounted_price : item.price}
                    </span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
