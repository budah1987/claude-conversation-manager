'use client';

import { cn } from '@/lib/utils';

interface TopicDotProps {
  color: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function TopicDot({ color, size = 'sm', className }: TopicDotProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full shrink-0',
        size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}
