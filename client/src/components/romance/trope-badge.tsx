import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type TropeCategory = 'relationship' | 'plot' | 'character' | 'setting';

interface TropeBadgeProps {
  name: string;
  category: TropeCategory;
  isCore?: boolean;
  className?: string;
  onRemove?: () => void;
}

const categoryConfig = {
  relationship: {
    className: 'trope-category-relationship bg-tender-100 text-tender-800 border-tender-300',
    icon: '💕'
  },
  plot: {
    className: 'trope-category-plot bg-romance-rose-gold-100 text-romance-rose-gold-800 border-romance-rose-gold-300',
    icon: '📖'
  },
  character: {
    className: 'trope-category-character bg-romance-champagne-100 text-romance-champagne-800 border-romance-champagne-300',
    icon: '👤'
  },
  setting: {
    className: 'trope-category-setting bg-sensual-100 text-sensual-800 border-sensual-300',
    icon: '🏛️'
  }
};

export function TropeBadge({ 
  name, 
  category, 
  isCore = false, 
  className, 
  onRemove 
}: TropeBadgeProps) {
  const config = categoryConfig[category];
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium relative',
        config.className,
        isCore && 'ring-2 ring-romance-burgundy-400 ring-offset-1',
        onRemove && 'pr-6',
        className
      )}
    >
      <span className="mr-1">{config.icon}</span>
      {name}
      {isCore && (
        <span className="ml-1 text-xs font-bold" title="Core Trope">★</span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs hover:text-red-600"
          title="Remove trope"
        >
          ×
        </button>
      )}
    </Badge>
  );
}

export function TropeList({ 
  tropes, 
  onRemove 
}: { 
  tropes: Array<{ name: string; category: TropeCategory; isCore?: boolean; id?: string }>;
  onRemove?: (id: string) => void;
}) {
  if (tropes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No tropes selected yet
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tropes.map((trope, index) => (
        <TropeBadge
          key={trope.id || index}
          name={trope.name}
          category={trope.category}
          isCore={trope.isCore}
          onRemove={onRemove && trope.id ? () => onRemove(trope.id!) : undefined}
        />
      ))}
    </div>
  );
}

export { type TropeCategory };