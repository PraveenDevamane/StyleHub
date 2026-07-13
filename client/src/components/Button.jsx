import React from 'react';

export default function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const baseClass = 'btn';
  const variantClass = 
    variant === 'primary' ? 'btn-primary' : 
    variant === 'secondary' ? 'btn-secondary' : 
    'btn-ghost';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${className}`}
      style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
      {...props}
    >
      {children}
    </button>
  );
}
