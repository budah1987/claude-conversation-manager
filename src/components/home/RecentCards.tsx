'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectPill } from '@/components/ui/ProjectPill';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { Conversation } from '@/types';

const GAP = 12;

interface RecentCardsProps {
  conversations: Conversation[];
  label: string;
  isFiltered: boolean;
  onClearFilter: () => void;
}

export function RecentCards({
  conversations,
  label,
  isFiltered,
  onClearFilter,
}: RecentCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const showArrows = conversations.length > 3;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, conversations]);

  const scroll = useCallback((direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.children[0] as HTMLElement;
    const cardWidth = firstCard?.offsetWidth ?? (el.clientWidth - 2 * GAP) / 3;
    el.scrollBy({ left: direction * (cardWidth + GAP), behavior: 'smooth' });
  }, []);

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <SectionLabel>{label}</SectionLabel>
        {isFiltered && (
          <button
            onClick={onClearFilter}
            aria-label="Clear filter"
            className="flex items-center justify-center w-4 h-4 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="relative">
        {/* Left arrow */}
        {showArrows && canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Right arrow */}
        {showArrows && canScrollRight && (
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Scrollable card row */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-none"
          style={{ gap: GAP, scrollBehavior: 'smooth' }}
        >
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/conversation/${conversation.id}`}
              className="group block flex-none recent-card rounded-[var(--card-radius)] border-[0.5px] border-[var(--border-tertiary)] p-4 transition-all hover:border-[var(--border-secondary)] focus-ring"
              style={{
                backgroundColor: 'var(--surface-card)',
              }}
            >
              <div className="flex items-center justify-end mb-2">
                <span className="text-[11px] text-[var(--text-ghost)]">
                  {conversation.timestamp}
                </span>
              </div>

              <h3 className="text-[13px] font-semibold text-[var(--text-primary)] truncate mb-1.5 group-hover:text-[var(--accent-primary)] transition-colors">
                {conversation.title}
              </h3>

              <p className="text-[12px] text-[var(--text-tertiary)] leading-[1.4] line-clamp-2 mb-3">
                {conversation.preview}
              </p>

              {conversation.project && (
                <ProjectPill name={conversation.project} />
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
