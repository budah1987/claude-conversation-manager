// src/app/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatInputCentered } from '@/components/home/ChatInputCentered';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { useCommandK } from '@/hooks/useCommandK';

export default function Home() {
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

  return (
    <div className="flex h-screen w-full bg-[var(--surface-app)] overflow-hidden font-[family-name:var(--font-sans)]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onClose={() => setIsSidebarOpen(false)}
        onSearchClick={openSearch}
        onConversationClick={handleConversationClick}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col items-center justify-center px-6 pl-14 lg:pl-6">
        <div className="w-full max-w-2xl flex flex-col items-center gap-8">
          {/* Greeting */}
          <h1
            className="text-[28px] md:text-[32px] font-normal text-[var(--text-primary)] flex items-center gap-2"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            <span className="text-[32px] md:text-[36px]" aria-hidden="true">✨</span>
            Evening, Amir
          </h1>

          {/* Centered chat input */}
          <ChatInputCentered />

          {/* Quick action pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              aria-label="Write"
            >
              {/* TODO: Replace with proper SVG icon */}
              <span className="w-4 h-4 rounded bg-[var(--text-ghost)] opacity-20" aria-hidden="true" />
              Write
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              aria-label="Learn"
            >
              {/* TODO: Replace with proper SVG icon */}
              <span className="w-4 h-4 rounded bg-[var(--text-ghost)] opacity-20" aria-hidden="true" />
              Learn
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              aria-label="From Drive"
            >
              {/* TODO: Replace with proper SVG icon */}
              <span className="w-4 h-4 rounded bg-[var(--text-ghost)] opacity-20" aria-hidden="true" />
              From Drive
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              aria-label="From Calendar"
            >
              {/* TODO: Replace with proper SVG icon */}
              <span className="w-4 h-4 rounded bg-[var(--text-ghost)] opacity-20" aria-hidden="true" />
              From Calendar
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full border-[0.5px] border-[var(--border-tertiary)] bg-[var(--surface-card)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              aria-label="From Gmail"
            >
              {/* TODO: Replace with proper SVG icon */}
              <span className="w-4 h-4 rounded bg-[var(--text-ghost)] opacity-20" aria-hidden="true" />
              From Gmail
            </button>
          </div>
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
