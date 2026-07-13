import React from 'react';

export default function GlassCard({ children, className = '', intensity = 12, ...props }) {
  return (
    <div
      className={`glass-panel interactive-card ${className}`}
      style={{
        padding: '16px',
        backdropFilter: `blur(${intensity}px)`,
        WebkitBackdropFilter: `blur(${intensity}px)`,
        ...props.style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
