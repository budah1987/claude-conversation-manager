'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { BookmarkCard } from '@/components/bookmarks/BookmarkCard';
import { useBookmarks } from '@/context/BookmarkContext';

export default function SavedPage() {
  const { bookmarks } = useBookmarks();

  // Sort by most recent first
  const sortedBookmarks = [...bookmarks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-[28px] font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Saved
            </h1>
            <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
              {sortedBookmarks.length} {sortedBookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
            </p>
          </div>

          {/* Bookmarks Grid */}
          {sortedBookmarks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[15px]" style={{ color: 'var(--text-tertiary)' }}>
                No bookmarks yet. Click the bookmark icon on any conversation to save it.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
