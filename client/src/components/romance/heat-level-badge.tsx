import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type HeatLevel = 'sweet' | 'warm' | 'steamy' | 'scorching';

interface HeatLevelBadgeProps {
  level: HeatLevel;
  className?: string;
  showIcon?: boolean;
}

const heatLevelConfig = {
  sweet: {
    label: 'Sweet',
    icon: '🍯',
    description: 'Clean romance, kisses only',
    className: 'heat-level-sweet bg-romance-champagne-100 text-romance-champagne-800 border-romance-champagne-300'
  },
  warm: {
    label: 'Warm',
    icon: '🌸',
    description: 'Some steam, fade to black',
    className: 'heat-level-warm bg-romance-blush-100 text-romance-blush-800 border-romance-blush-300'
  },
  steamy: {
    label: 'Steamy',
    icon: '🔥',
    description: 'Open door scenes',
    className: 'heat-level-steamy bg-romance-burgundy-100 text-romance-burgundy-800 border-romance-burgundy-300'
  },
  scorching: {
    label: 'Scorching',
    icon: '💥',
    description: 'Explicit content',
    className: 'heat-level-scorching bg-passion-100 text-passion-800 border-passion-300'
  }
};

export function HeatLevelBadge({ 
  level, 
  className, 
  showIcon = true 
}: HeatLevelBadgeProps) {
  const config = heatLevelConfig[level];
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium',
        config.className,
        className
      )}
      title={config.description}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

export function HeatLevelIndicator({ 
  level, 
  showDescription = false 
}: { 
  level: HeatLevel; 
  showDescription?: boolean; 
}) {
  const config = heatLevelConfig[level];
  
  return (
    <div className="flex items-center space-x-2">
      <HeatLevelBadge level={level} />
      {showDescription && (
        <span className="text-sm text-muted-foreground">
          {config.description}
        </span>
      )}
    </div>
  );
}

export { type HeatLevel };