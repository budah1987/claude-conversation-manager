'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { BookmarkCard } from '@/components/bookmarks/BookmarkCard';
import { useBookmarks } from '@/context/BookmarkContext';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { useCommandK } from '@/hooks/useCommandK';

export default function SavedPage() {
  const { bookmarks, pendingRemoval } = useBookmarks();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-collapse sidebar below 1024px on initial load
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  useCommandK(openSearch, closeSearch);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleConversationClick = useCallback((id: string) => {
    router.push(`/conversation/${id}`);
  }, [router]);

  // Filter out pending removals and sort by most recent first
  const sortedBookmarks = [...bookmarks]
    .filter((b) => !pendingRemoval.has(b.id))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <div className="flex h-screen w-full bg-[var(--surface-app)] overflow-hidden font-[family-name:var(--font-sans)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onClose={() => setIsSidebarOpen(false)}
        onSearchClick={openSearch}
        onConversationClick={handleConversationClick}
      />

      <main className="flex-1 overflow-y-auto relative">
        {/* Sticky top bar for mobile — provides background behind the fixed sidebar toggle */}
        <div
          className="sticky top-0 z-10 min-h-[48px] lg:hidden backdrop-blur-md"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--surface-app) 85%, transparent)',
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
              <AnimatePresence mode="popLayout">
                {sortedBookmarks.map((bookmark) => (
                  <motion.div
                    key={bookmark.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{
                      duration: 0.25,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    layout
                  >
                    <BookmarkCard bookmark={bookmark} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Search overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onNavigate={handleConversationClick}
      />
    </div>
  );
}
