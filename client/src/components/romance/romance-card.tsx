import React from 'react';
import { cn } from '@/lib/utils';

interface RomanceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'passion' | 'tender' | 'elegant';
  children: React.ReactNode;
}

export function RomanceCard({ 
  variant = 'default', 
  className, 
  children, 
  ...props 
}: RomanceCardProps) {
  const variantStyles = {
    default: 'bg-gradient-to-br from-romance-champagne-50 to-romance-blush-50 border-romance-burgundy-200',
    passion: 'bg-gradient-to-br from-passion-50 to-romance-burgundy-50 border-passion-200',
    tender: 'bg-gradient-to-br from-tender-50 to-romance-blush-50 border-tender-200',
    elegant: 'bg-gradient-to-br from-white to-romance-champagne-50 border-romance-rose-gold-200'
  };

  return (
    <div
      className={cn(
        'border shadow-romance-md rounded-lg p-6 transition-all duration-200 hover:shadow-romance-lg',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}