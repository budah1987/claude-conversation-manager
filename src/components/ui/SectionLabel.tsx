'use client';

import { cn } from '@/lib/utils';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <h2
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]',
        className
      )}
    >
      {children}
    </h2>
  );
}
