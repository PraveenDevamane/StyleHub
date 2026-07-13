import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useFavoritesStore } from '../store/favoritesStore';
import { Heart, ArrowRight } from 'lucide-react';
import Carousel from '../components/Carousel';
import ShimmerLoader from '../components/ShimmerLoader';
import CachedImage from '../components/CachedImage';
import GlassCard from '../components/GlassCard';
import { getDirectDriveUrl } from '../utils/image';

const HERO_BANNERS = [
  {
    id: '1',
    caption: (
      <div style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
        <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#FFE9CF', fontWeight: '700' }}>Autumn Winter '26</p>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', fontFamily: 'var(--font-display)', margin: '8px 0' }}>The New Standard</h2>
        <p style={{ fontSize: '1rem', color: '#FFF7ED', opacity: 0.9 }}>Explore curated essentials designed for the modern silhouette.</p>
      </div>
    ),
    image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600',
  },
  {
    id: '2',
    caption: (
      <div style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
        <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#FFE9CF', fontWeight: '700' }}>Fresh drops</p>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', fontFamily: 'var(--font-display)', margin: '8px 0' }}>Move With Color</h2>
        <p style={{ fontSize: '1rem', color: '#FFF7ED', opacity: 0.9 }}>Sneakers, sandals, and formal picks with bright everyday energy.</p>
      </div>
    ),
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600',
  },
  {
    id: '3',
    caption: (
      <div style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
        <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#FFE9CF', fontWeight: '700' }}>Occasion edit</p>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', fontFamily: 'var(--font-display)', margin: '8px 0' }}>Where Tradition Shines</h2>
        <p style={{ fontSize: '1rem', color: '#FFF7ED', opacity: 0.9 }}>Premium textures, festive color, and joyful product discovery.</p>
      </div>
    ),
    image_url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600',
  },
];

const CATEGORY_FALLBACKS = {
  accessories: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500',
  bags: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
  dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
  footwear: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
  jackets: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
  jeans: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500',
  shirts: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
  kurta: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500',
  lehenga: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500',
  saree: 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=500',
};

export default function Home() {
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  // Fetch Categories
  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('API failure');
      return res.json();
    },
  });

  // Fetch Featured Products
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery({
    queryKey: ['products-featured'],
    queryFn: async () => {
      const res = await fetch('/api/products?featured=true&limit=6');
      if (!res.ok) throw new Error('API failure');
      return res.json();
    },
  });

  // Fetch New Arrivals
  const { data: newArrivals, isLoading: newLoading } = useQuery({
    queryKey: ['products-new'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=6');
      if (!res.ok) throw new Error('API failure');
      return res.json();
    },
  });

  // Fetch Trending Products
  const { data: trendingProducts, isLoading: trendingLoading } = useQuery({
    queryKey: ['products-trending'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=6'); // fallback if no specific trending route
      if (!res.ok) throw new Error('API failure');
      // Simulated trending logic (e.g. sorted by stock low/popular)
      const list = [...await res.json()];
      list.sort((a, b) => a.stock_quantity - b.stock_quantity);
      return list;
    },
  });

  const getCategoryImage = (cat) => {
    if (cat.image_url) return cat.image_url;
    const key = cat.name.toLowerCase();
    return CATEGORY_FALLBACKS[key] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500';
  };

  const handleWishlistToggle = (e, item) => {
    e.stopPropagation();
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  };

  const renderProductCard = (item) => {
    const isFav = isFavorite(item.id);
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
        onClick={() => navigate(`/product/${item.id}`)}
      >
        <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden' }}>
          <CachedImage source={{ uri: mainImage }} alt={item.name} showLoader={false} />
          {/* Wishlist Button */}
          <button
            onClick={(e) => handleWishlistToggle(e, item)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--background-element)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow)',
              zIndex: 5,
            }}
          >
            <Heart size={18} fill={isFav ? '#FF3B30' : 'none'} color={isFav ? '#FF3B30' : 'var(--text-secondary)'} />
          </button>

          {/* Discount Tag */}
          {hasDiscount && (
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                backgroundColor: 'var(--accent)',
                color: 'var(--background-element)',
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              SALE
            </div>
          )}
        </div>

        <div style={{ padding: '12px 6px 6px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{item.categories?.name || 'Garments'}</p>
          <h4 style={{ fontSize: '1rem', color: 'var(--text)', margin: '4px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '700', color: 'var(--accent)' }}>
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
  };

  return (
    <div className="container" style={{ paddingBottom: '60px', paddingTop: '20px' }}>
      {/* Hero Banner Banner */}
      <section style={{ height: '380px', marginBottom: '40px' }} className="animate-fade-in">
        <Carousel images={HERO_BANNERS} autoPlay interval={5000} />
      </section>

      {/* Categories Horizontal Grid */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text)' }}>Browse Categories</h2>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '12px',
          }}
        >
          {catsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ minWidth: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <ShimmerLoader width="80px" height="80px" borderRadius="50%" />
                <ShimmerLoader width="60px" height="14px" />
              </div>
            ))
          ) : (
            categories?.map((cat) => (
              <div
                key={cat.id}
                onClick={() => navigate(`/search?categoryId=${cat.id}`)}
                style={{
                  minWidth: '90px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    marginBottom: '8px',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img src={getDirectDriveUrl(getCategoryImage(cat))} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text)' }}>{cat.name}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Featured Section */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text)' }}>Featured Products</h2>
          <Link to="/search?featured=true" style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            See All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid-cols-auto">
          {featuredLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ShimmerLoader height="220px" borderRadius="12px" />
                  <ShimmerLoader width="40%" height="14px" />
                  <ShimmerLoader width="80%" height="18px" />
                  <ShimmerLoader width="30%" height="16px" />
                </div>
              ))
            : featuredProducts?.slice(0, 4).map(renderProductCard)}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text)' }}>New Arrivals</h2>
          <Link to="/search" style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            See All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid-cols-auto">
          {newLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ShimmerLoader height="220px" borderRadius="12px" />
                  <ShimmerLoader width="40%" height="14px" />
                  <ShimmerLoader width="80%" height="18px" />
                  <ShimmerLoader width="30%" height="16px" />
                </div>
              ))
            : newArrivals?.slice(0, 4).map(renderProductCard)}
        </div>
      </section>

      {/* Trending Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text)' }}>Trending Now</h2>
          <Link to="/search" style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            See All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid-cols-auto">
          {trendingLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ShimmerLoader height="220px" borderRadius="12px" />
                  <ShimmerLoader width="40%" height="14px" />
                  <ShimmerLoader width="80%" height="18px" />
                  <ShimmerLoader width="30%" height="16px" />
                </div>
              ))
            : trendingProducts?.slice(0, 4).map(renderProductCard)}
        </div>
      </section>
    </div>
  );
}
