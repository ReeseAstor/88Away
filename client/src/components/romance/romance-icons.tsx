import React from 'react';
import { cn } from '@/lib/utils';

interface RomanceIconProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const iconMap = {
  // Romance genre icons
  heart: '💖',
  'heart-eyes': '😍',
  kiss: '💋',
  'wedding-rings': '💍',
  rose: '🌹',
  'love-letter': '💌',
  cupid: '💘',
  'heart-arrow': '💘',
  
  // Heat level icons
  flame: '🔥',
  'hot-face': '🥵',
  honey: '🍯',
  blossom: '🌸',
  explosion: '💥',
  
  // Trope category icons
  'couple': '👫',
  'book': '📖',
  'person': '👤',
  'castle': '🏛️',
  'city': '🏙️',
  'beach': '🏖️',
  
  // Series and publishing
  'book-stack': '📚',
  'writing': '✍️',
  'edit': '✏️',
  'publish': '📝',
  'crown': '👑',
  'star': '⭐',
  'diamond': '💎',
  
  // Emotions and relationships
  'sparks': '✨',
  'butterfly': '🦋',
  'champagne': '🥂',
  'sunset': '🌅',
  'moonlight': '🌙',
  'candle': '🕯️',
  
  // Analytics and business
  'chart-up': '📈',
  'money': '💰',
  'target': '🎯',
  'trophy': '🏆',
  'medal': '🏅',
  
  // Actions
  'plus': '➕',
  'edit-pencil': '✏️',
  'trash': '🗑️',
  'save': '💾',
  'download': '⬇️',
  'upload': '⬆️',
  'search': '🔍',
  'filter': '🔽',
  'settings': '⚙️',
  'info': 'ℹ️',
  'warning': '⚠️',
  'success': '✅',
  'error': '❌'
};

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

export function RomanceIcon({ 
  name, 
  className, 
  size = 'md' 
}: RomanceIconProps) {
  const icon = iconMap[name as keyof typeof iconMap] || '❓';
  
  return (
    <span 
      className={cn(
        'inline-block',
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={name}
    >
      {icon}
    </span>
  );
}

export function RomanceIconButton({
  icon,
  onClick,
  className,
  size = 'md',
  disabled = false,
  title
}: {
  icon: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex items-center justify-center rounded-md border border-romance-burgundy-200 bg-white hover:bg-romance-blush-50 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-romance-burgundy-400 focus:ring-offset-2',
        size === 'sm' && 'h-6 w-6',
        size === 'md' && 'h-8 w-8',
        size === 'lg' && 'h-10 w-10',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <RomanceIcon name={icon} size={size} />
    </button>
  );
}