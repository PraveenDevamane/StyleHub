import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';

export default function Splash() {
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--background)',
        animation: 'fadeIn 0.5s ease-out',
        position: 'relative'
      }}
    >
      <style>{`
        @keyframes scaleUp {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUpFade {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .splash-logo {
          animation: scaleUp 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .splash-brand {
          animation: slideUpFade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.6s;
          opacity: 0;
          text-align: center;
          margin-top: 24px;
        }
      `}</style>

      {/* Logo Outline */}
      <div
        className="splash-logo"
        style={{
          width: '110px',
          height: '110px',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          backgroundColor: 'var(--tint)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          boxShadow: 'var(--shadow)',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: '42px', fontWeight: '900', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>S</span>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', marginTop: '16px' }} />
        <span style={{ fontSize: '42px', fontWeight: '900', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>H</span>
      </div>

      {/* Brand Text */}
      <div className="splash-brand">
        <h1 style={{ fontSize: '2rem', color: 'var(--text)', fontWeight: '800', fontFamily: 'var(--font-display)' }}>StyleHub</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '4px' }}>
          Curated fashion catalog
        </p>
      </div>
    </div>
  );
}
