import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useFavoritesStore } from '../store/favoritesStore';
import { Heart, Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import ShimmerLoader from '../components/ShimmerLoader';
import GlassCard from '../components/GlassCard';
import CachedImage from '../components/CachedImage';

const DEFAULT_SUBCATEGORIES = [
  'Sneakers', 'Formal Shoes', 'Sandals', 'Slippers', 'Sports Shoes', 'Boots', 'Loaders', 'Heels',
  'Bellies', 'Kolhapuri', 'Slim Fit', 'Straight Fit', 'Skinny', 'Bootcut', 'Wide Leg', 'Ripped',
  'High Waist', 'Mom Jeans', 'Silk Saree', 'Cotton Saree', 'Chiffon Saree', 'Georgette Saree',
  'Banarasi Saree', 'Linen Saree', 'Designer Saree', 'Half Saree', 'Boys Clothing', 'Girls Clothing',
  'Maxi Dress', 'A-Line Dress', 'Cocktail Dress', 'Evening Gown', 'Bridal Lehenga', 'Lehenga Choli',
  'Baby Rompers', 'Kids Ethnic', 'School Uniforms', 'Analog', 'Digital', 'Smart Watches', 'Luxury Watches',
  'Sports Watches', 'Jewelry', 'Sunglasses', 'Clutches', 'Laptop Bags', 'Belts', 'Bags', 'Wallets',
  'Hats', 'Scarves', 'Hair Accessories', 'Bangles', 'Handbags', 'Backpacks', 'Sling Bags', 'Tote Bags',
  'Denim Jacket', 'Leather Jacket', 'Bomber Jacket', 'Windcheater', 'Blazer', 'Puffer Jacket', 'Sweaters',
  'Hoodies', 'Coats', 'Round Neck', 'V-Neck', 'Polo', 'Oversized', 'Graphic Tees', 'Printed', 'Plain',
  'Formal Shirts', 'Casual Shirts', 'Linen Shirts', 'Checked Shirts', 'Printed Shirts', 'Straight Kurta',
  'A-Line Kurta', 'Anarkali', 'Kurta Set', 'Pathani', 'Nehru Jacket', 'Jerseys', 'Track Pants', 'Gym Wear', 'Yoga Wear'
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  // Local filter states synced to SearchParams
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || '');
  const [featured, setFeatured] = useState(searchParams.get('featured') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Synced local state with url search param changes
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setCategoryId(searchParams.get('categoryId') || '');
    setSubcategory(searchParams.get('subcategory') || '');
    setFeatured(searchParams.get('featured') === 'true');
    setSortBy(searchParams.get('sortBy') || 'newest');
  }, [searchParams]);

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('API failure');
      return res.json();
    },
  });

  // Fetch Filtered Products
  const { data: products, isLoading } = useQuery({
    queryKey: ['products-search', categoryId, subcategory, searchQuery, featured, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (subcategory) params.append('subcategory', subcategory);
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (featured) params.append('featured', 'true');
      if (sortBy) params.append('sortBy', sortBy);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('API failure');
      return res.json();
    },
  });

  const applyFilters = (newParams) => {
    const nextParams = { ...Object.fromEntries(searchParams.entries()), ...newParams };
    // Remove empty parameters
    Object.keys(nextParams).forEach((key) => {
      if (!nextParams[key] || nextParams[key] === 'false') {
        delete nextParams[key];
      }
    });
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters({ q: searchQuery });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryId('');
    setSubcategory('');
    setFeatured(false);
    setSortBy('newest');
    setSearchParams({});
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
        className="interactive-card animate-fade-in"
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
        <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden' }}>
          <CachedImage source={{ uri: mainImage }} alt={item.name} showLoader={false} />
          <button
            onClick={(e) => handleWishlistToggle(e, item)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '32px',
              height: '32px',
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
            <Heart size={16} fill={isFav ? '#FF3B30' : 'none'} color={isFav ? '#FF3B30' : 'var(--text-secondary)'} />
          </button>
          {hasDiscount && (
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'var(--accent)', color: 'var(--background-element)', fontSize: '0.7rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
              SALE
            </div>
          )}
        </div>
        <div style={{ padding: '8px 4px 4px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{item.categories?.name}</p>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', margin: '2px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: '750', color: 'var(--accent)', fontSize: '0.9rem' }}>
              ${hasDiscount ? item.discounted_price : item.price}
            </span>
            {hasDiscount && (
              <span style={{ fontSize: '0.8rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                ${item.price}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    );
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text)' }}>Filters</h3>
        <button onClick={handleClearFilters} style={{ fontSize: '0.8rem', color: 'var(--accent)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }}>
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div className="form-group">
        <label className="form-label">Category</label>
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            applyFilters({ categoryId: e.target.value });
          }}
          className="form-input"
          style={{ backgroundColor: 'var(--background-element)' }}
        >
          <option value="">All Categories</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Subcategory Filter */}
      <div className="form-group">
        <label className="form-label">Subcategory</label>
        <select
          value={subcategory}
          onChange={(e) => {
            setSubcategory(e.target.value);
            applyFilters({ subcategory: e.target.value });
          }}
          className="form-input"
          style={{ backgroundColor: 'var(--background-element)' }}
        >
          <option value="">All Subcategories</option>
          {DEFAULT_SUBCATEGORIES.sort().map((sub, idx) => (
            <option key={idx} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      {/* Featured checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => {
            setFeatured(e.target.checked);
            applyFilters({ featured: e.target.checked ? 'true' : 'false' });
          }}
          style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
        />
        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)' }}>Featured Products Only</span>
      </label>
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: '60px', paddingTop: '20px' }}>
      {/* Mobile filter triggers stylesheet */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .search-grid-layout { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .mobile-filter-trigger { display: none !important; }
        }
      `}</style>

      {/* Search Bar & Header */}
      <div style={{ marginBottom: '32px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search garments, codes, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '44px', height: '48px', fontSize: '0.95rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', height: '48px' }}>Search</button>
        </form>
      </div>

      {/* Action Controls (Mobile filters & sort) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => setShowMobileFilters(true)}
          className="btn btn-secondary mobile-filter-trigger flex-row"
          style={{ gap: '6px', fontSize: '0.85rem' }}
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
        <div className="hide-mobile" />

        {/* Sort Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowUpDown size={16} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              applyFilters({ sortBy: e.target.value });
            }}
            className="form-input"
            style={{ width: '160px', padding: '6px 12px', fontSize: '0.85rem', backgroundColor: 'var(--background-element)' }}
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main layout (Sidebar + Grid) */}
      <div className="search-grid-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px' }}>
        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar">
          <GlassCard style={{ padding: '24px' }}>
            <SidebarContent />
          </GlassCard>
        </aside>

        {/* Results Grid */}
        <div>
          {isLoading ? (
            <div className="grid-cols-auto">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ShimmerLoader height="200px" borderRadius="12px" />
                  <ShimmerLoader width="40%" height="14px" />
                  <ShimmerLoader width="80%" height="18px" />
                  <ShimmerLoader width="30%" height="16px" />
                </div>
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <SlidersHorizontal size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '8px' }}>No matches found</h3>
              <p style={{ fontSize: '0.9rem' }}>Try clearing filters or adjusting search queries.</p>
            </div>
          ) : (
            <div className="grid-cols-auto">{products.map(renderProductCard)}</div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Slide-in Modal for Filters */}
      {showMobileFilters && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            style={{
              width: '280px',
              height: '100%',
              backgroundColor: 'var(--background)',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
              animation: 'slideLeft 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes slideLeft {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="btn btn-ghost" style={{ padding: '6px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </div>
  );
}
