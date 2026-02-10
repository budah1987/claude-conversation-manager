'use client';

import { cn } from '@/lib/utils';

interface ProjectPillProps {
  name: string;
  className?: string;
}

export function ProjectPill({ name, className }: ProjectPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
        'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]',
        'border-[0.5px] border-[var(--border-tertiary)]',
        className
      )}
    >
      {name}
    </span>
  );
}
