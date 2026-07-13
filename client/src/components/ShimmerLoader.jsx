import React from 'react';
import { useThemeStore } from '../store/themeStore';

export default function ShimmerLoader({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
  style = {}
}) {
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme === 'dark' ? '#2A1D35' : '#F2DCBF';

  return (
    <>
      <style>{`
        @keyframes shimmerPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        .shimmer-anim {
          animation: shimmerPulse 1.3s ease-in-out infinite;
        }
      `}</style>
      <div
        className={`shimmer-anim ${className}`}
        style={{
          width,
          height,
          borderRadius,
          backgroundColor,
          overflow: 'hidden',
          ...style
        }}
      />
    </>
  );
}
