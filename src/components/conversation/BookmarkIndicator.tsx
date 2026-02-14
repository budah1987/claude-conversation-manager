'use client';

export function BookmarkIndicator() {
  return (
    <div className="relative">
      {/* Enhanced left border accent for bookmarked messages */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[4px] rounded-r-sm"
        style={{
          backgroundColor: 'var(--accent-primary)',
          opacity: 0.6,
        }}
      />
    </div>
  );
}
