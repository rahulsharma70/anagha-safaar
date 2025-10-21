// src/components/ui/mobile-optimized.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileOptimizedProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}

export const MobileOptimized = ({ 
  children, 
  className = '',
  mobileClassName = '',
  desktopClassName = ''
}: MobileOptimizedProps) => {
  return (
    <div className={cn(
      className,
      mobileClassName,
      `md:${desktopClassName}`
    )}>
      {children}
    </div>
  );
};

// Mobile-first responsive grid
export const ResponsiveGrid = ({ 
  children, 
  cols = 1,
  className = ''
}: { 
  children: ReactNode; 
  cols?: number;
  className?: string;
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[cols as keyof typeof gridCols], className)}>
      {children}
    </div>
  );
};

// Touch-friendly button
export const TouchButton = ({ 
  children, 
  className = '',
  ...props 
}: { 
  children: ReactNode; 
  className?: string;
  [key: string]: any;
}) => {
  return (
    <button
      className={cn(
        'min-h-[44px] min-w-[44px] touch-manipulation',
        'active:scale-95 transition-transform',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Mobile-optimized card
export const MobileCard = ({ 
  children, 
  className = '',
  clickable = false
}: { 
  children: ReactNode; 
  className?: string;
  clickable?: boolean;
}) => {
  return (
    <div className={cn(
      'p-4 rounded-lg border bg-card',
      clickable && 'active:scale-98 transition-transform cursor-pointer',
      className
    )}>
      {children}
    </div>
  );
};
