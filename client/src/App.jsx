import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { Home as HomeIcon, Search, Heart, User, Sparkles, LayoutDashboard, Database, FolderHeart, LogOut } from 'lucide-react';

// Pages imports
import Splash from './pages/Splash';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import SearchPage from './pages/Search';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminInventory from './pages/AdminInventory';
import AdminCategories from './pages/AdminCategories';
import AdminEditor from './pages/AdminEditor';
import ThemeToggle from './components/ThemeToggle';

// Admin Protected Layout Guard
function AdminGuard({ children }) {
  const { isAdmin, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <div className="spinner" style={{ border: '4px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  const setSession = useAuthStore((state) => state.setSession);
  const { session, isAdmin, signOut } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setSession(firebaseUser);
    });
    return unsubscribe;
  }, [setSession]);

  const showNavbar = location.pathname !== '/splash';
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showNavbar && (
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 99,
            backgroundColor: 'var(--card)',
            borderBottom: '1px solid var(--card-border)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="container" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo */}
            <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--tint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  color: 'var(--text)',
                }}
              >
                S.H
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text)' }}>StyleHub</span>
            </Link>

            {/* Desktop Navigation */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {!isAdminPath ? (
                <>
                  <Link to="/home" className={`flex-row`} style={{ gap: '6px', fontWeight: '600', color: location.pathname === '/home' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <HomeIcon size={18} /> <span className="hide-mobile">Home</span>
                  </Link>
                  <Link to="/search" className={`flex-row`} style={{ gap: '6px', fontWeight: '600', color: location.pathname === '/search' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <Search size={18} /> <span className="hide-mobile">Search</span>
                  </Link>
                  <Link to="/wishlist" className={`flex-row`} style={{ gap: '6px', fontWeight: '600', color: location.pathname === '/wishlist' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <Heart size={18} /> <span className="hide-mobile">Wishlist</span>
                  </Link>
                  <Link to="/profile" className={`flex-row`} style={{ gap: '6px', fontWeight: '600', color: location.pathname === '/profile' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <User size={18} /> <span className="hide-mobile">Profile</span>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/dashboard" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      Admin Panel
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/admin/dashboard" className={`flex-row`} style={{ gap: '6px', fontWeight: '600', color: location.pathname === '/admin/dashboard' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <LayoutDashboard size={18} /> <span>Dashboard</span>
                  </Link>
                  <Link to="/admin/inventory" className={`flex-row`} style={{ gap: '6px', fontWeight: '600', color: location.pathname === '/admin/inventory' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <Database size={18} /> <span>Inventory</span>
                  </Link>
                  <Link to="/admin/categories" className={`flex-row`} style={{ gap: '6px', fontWeight: '600', color: location.pathname === '/admin/categories' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <FolderHeart size={18} /> <span>Categories</span>
                  </Link>
                  <button onClick={signOut} className="btn btn-ghost flex-row" style={{ gap: '6px', color: '#EF4444' }}>
                    <LogOut size={18} /> <span>Logout</span>
                  </button>
                  <Link to="/home" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    View Store
                  </Link>
                </>
              )}
              <ThemeToggle />
            </nav>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/splash" replace />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/home" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="/admin/inventory" element={<AdminGuard><AdminInventory /></AdminGuard>} />
          <Route path="/admin/categories" element={<AdminGuard><AdminCategories /></AdminGuard>} />
          <Route path="/admin/editor" element={<AdminGuard><AdminEditor /></AdminGuard>} />
        </Routes>
      </main>

      {/* Mobile Bottom Tab Bar (renders for screens < 640px) */}
      {showNavbar && !isAdminPath && (
        <div
          className="show-mobile-only"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '64px',
            backgroundColor: 'var(--card)',
            borderTop: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 99,
          }}
        >
          <style>{`
            .mobile-tab-link {
              display: flex;
              flex-direction: column;
              align-items: center;
              font-size: 0.7rem;
              font-weight: 700;
              color: var(--text-secondary);
              gap: 4px;
            }
            .mobile-tab-link.active {
              color: var(--accent);
            }
            @media (min-width: 641px) {
              .show-mobile-only { display: none !important; }
            }
            @media (max-width: 640px) {
              .hide-mobile { display: none !important; }
              main { padding-bottom: 74px; } /* Spacer for mobile tab bar */
            }
          `}</style>
          <Link to="/home" className={`mobile-tab-link ${location.pathname === '/home' ? 'active' : ''}`}>
            <HomeIcon size={20} />
            <span>Home</span>
          </Link>
          <Link to="/search" className={`mobile-tab-link ${location.pathname === '/search' ? 'active' : ''}`}>
            <Search size={20} />
            <span>Search</span>
          </Link>
          <Link to="/wishlist" className={`mobile-tab-link ${location.pathname === '/wishlist' ? 'active' : ''}`}>
            <Heart size={20} />
            <span>Saved</span>
          </Link>
          <Link to="/profile" className={`mobile-tab-link ${location.pathname === '/profile' ? 'active' : ''}`}>
            <User size={20} />
            <span>Profile</span>
          </Link>
        </div>
      )}
    </div>
  );
}
