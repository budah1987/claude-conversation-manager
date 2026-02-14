'use client';

import { Copy, Play, ThumbsUp, ThumbsDown, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionRowProps {
  isBookmarked: boolean;
  onBookmarkClick: () => void;
  hasMultipleSolutions?: boolean;
}

export function ActionRow({
  isBookmarked,
  onBookmarkClick,
  hasMultipleSolutions = false,
}: ActionRowProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      {/* Left group: Copy, Play, ThumbsUp, ThumbsDown */}
      <div className="flex items-center gap-0.5">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-ghost)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
            e.currentTarget.style.backgroundColor =
              'color-mix(in srgb, var(--text-primary) 5%, transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-ghost)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Copy"
        >
          <Copy size={15} strokeWidth={1.5} />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-ghost)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
            e.currentTarget.style.backgroundColor =
              'color-mix(in srgb, var(--text-primary) 5%, transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-ghost)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Thumbs up"
        >
          <ThumbsUp size={15} strokeWidth={1.5} />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-ghost)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
            e.currentTarget.style.backgroundColor =
              'color-mix(in srgb, var(--text-primary) 5%, transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-ghost)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Thumbs down"
        >
          <ThumbsDown size={15} strokeWidth={1.5} />
        </button>
      </div>

      {/* Right side: Bookmark icon */}
      <button
        onClick={onBookmarkClick}
        className="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
        style={{
          color: isBookmarked ? '#BB4823' : 'var(--text-ghost)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = isBookmarked ? '#BB4823' : 'var(--text-tertiary)';
          e.currentTarget.style.backgroundColor =
            'color-mix(in srgb, var(--text-primary) 5%, transparent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isBookmarked ? '#BB4823' : 'var(--text-ghost)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        <Bookmark
          size={16}
          strokeWidth={1.5}
          fill={isBookmarked ? '#BB4823' : 'none'}
          stroke={isBookmarked ? '#BB4823' : 'currentColor'}
        />
      </button>
    </div>
  );
}
