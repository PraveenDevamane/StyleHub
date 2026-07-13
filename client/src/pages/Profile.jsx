import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { LogIn, UserPlus, LogOut, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { showAlert } from '../utils/alert';

export default function Profile() {
  const { session, user, isAdmin, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    if (session && isAdmin) {
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [session, isAdmin, navigate, location]);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showAlert('Success', 'Logged in successfully!');
    } catch (err) {
      console.error(err);
      setError(err.message.includes('auth/invalid-credential') ? 'Invalid email or password' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      showAlert('Success', 'Account created successfully!');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If logged in
  if (session) {
    return (
      <div className="container animate-fade-in" style={{ paddingBottom: '60px', paddingTop: '40px', maxWidth: '640px' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '24px', textAlign: 'center' }}>My Account</h1>
        <GlassCard style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid var(--border)',
            }}
          >
            <UserPlus size={36} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Welcome back!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px' }}>{session.user?.email}</p>

          <Button
            variant="ghost"
            onClick={signOut}
            className="flex-row"
            style={{ marginTop: '16px', color: '#EF4444', width: '100%', height: '48px', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <LogOut size={18} /> Sign Out
          </Button>
        </GlassCard>
      </div>
    );
  }

  // If logged out
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px', paddingTop: '40px', maxWidth: '460px' }}>
      <GlassCard style={{ padding: '32px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '28px' }}>
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            style={{ flex: 1, padding: '12px' }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            style={{ flex: 1, padding: '12px' }}
          >
            Register
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} style={{ width: '100%', height: '48px' }}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} style={{ width: '100%', height: '48px' }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
