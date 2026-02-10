'use client';

import { cn } from '@/lib/utils';

interface KeyboardBadgeProps {
  keys: string[];
  className?: string;
}

export function KeyboardBadge({ keys, className }: KeyboardBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded text-[11px] font-medium bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[0.5px] border-[var(--border-tertiary)]"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
