import { Crown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SubscriptionBadgeProps {
  tier: 'free' | 'creator_pro';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SubscriptionBadge({ tier, size = 'md', className }: SubscriptionBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  if (tier === 'creator_pro') {
    return (
      <Badge 
        className={cn(
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1",
          sizeClasses[size],
          className
        )}
      >
        <Crown className={iconSizes[size]} />
        Creator Pro
      </Badge>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn(sizeClasses[size], "gap-1", className)}
    >
      <Sparkles className={iconSizes[size]} />
      Free
    </Badge>
  );
}
