import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RomanceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'passion' | 'tender' | 'elegant';
  size?: 'sm' | 'default' | 'lg';
  children: React.ReactNode;
}

export function RomanceButton({ 
  variant = 'primary',
  size = 'default',
  className,
  children,
  ...props 
}: RomanceButtonProps) {
  const baseStyles = 'font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-romance-burgundy-600 to-romance-burgundy-700 hover:from-romance-burgundy-700 hover:to-romance-burgundy-800 text-white shadow-romance-sm focus:ring-romance-burgundy-400',
    secondary: 'bg-gradient-to-r from-romance-rose-gold-100 to-romance-champagne-100 hover:from-romance-rose-gold-200 hover:to-romance-champagne-200 text-romance-burgundy-800 border border-romance-burgundy-200 focus:ring-romance-burgundy-400',
    passion: 'bg-gradient-to-r from-passion-600 to-passion-700 hover:from-passion-700 hover:to-passion-800 text-white shadow-romance-sm focus:ring-passion-400',
    tender: 'bg-gradient-to-r from-tender-500 to-tender-600 hover:from-tender-600 hover:to-tender-700 text-white shadow-romance-sm focus:ring-tender-400',
    elegant: 'bg-gradient-to-r from-white to-romance-champagne-50 hover:from-romance-champagne-50 hover:to-romance-champagne-100 text-romance-burgundy-800 border border-romance-rose-gold-200 shadow-sm focus:ring-romance-rose-gold-400'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    default: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}