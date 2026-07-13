import React, { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost"
      style={{
        padding: '8px',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun size={20} style={{ color: '#FBBF24' }} />
      ) : (
        <Moon size={20} style={{ color: '#FF6B00' }} />
      )}
    </button>
  );
}
